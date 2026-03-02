/* global Module, MM */

Module.register("MMM-AssistTouch", {
    defaults: {
        screens: ["home", "meds", "care"],
        startScreen: "home",
        homeScreen: "home",

        lockString: "MMM-AssistTouch",
        animationMs: 250,
        cooldownMs: 800,

        managedByDefault: false,
        defaultTag: "home",
        excludedModules: ["MMM-AssistTouch"],

        toastMs: 1200,
        storageKey: "MMM_AssistTouch_Screen",

        longPressMs: 650,

        showScreenIndicator: true,
        // supported: "top_bar" | "top_left" | "top_right"
        screenIndicatorPosition: "top_left",
        screenIndicatorLabelMap: { home: "HOME", meds: "MEDS", care: "CARE" },

        blockSwipeWhenSimpleRemoteActive: false,
        blockLongPressWhenSimpleRemoteActive: false,

        enableKeyboard: true,
        keyNext: ["ArrowDown", "PageDown", " ", "n"],
        keyHome: ["Home", "h"],

        // Mouse/web fallback: drag down anywhere to change screen
        enablePointerSwipe: true,
        pointerSwipeThresholdPx: 120, // must drag down at least this far
        pointerSwipeSlopPx: 8,        // ignore tiny jitters
        pointerSwipeMaxMs: 900,       // must complete within this time
        pointerSwipeButton: 0,        // left click only

        debugGestures: false
    },

    start() {
        this._hammer = null;
        this._lastSwipeAt = 0;
        this._toastUntil = 0;

        this._onKeyDown = null;

        this._simpleRemoteActive = false;

        // pointer swipe state
        this._ptr = { active: false, id: null, x0: 0, y0: 0, t0: 0 };

        this._onPtrDown = null;
        this._onPtrMove = null;
        this._onPtrUp = null;

        this._screens = Array.isArray(this.config.screens) && this.config.screens.length
            ? this.config.screens.map(String)
            : ["home"];

        const stored = this._loadStoredScreen();
        if (stored && this._screens.includes(stored)) {
            this.current = this._screens.indexOf(stored);
        } else {
            const startIdx = this._screens.indexOf(String(this.config.startScreen));
            this.current = startIdx >= 0 ? startIdx : 0;
        }
    },

    getStyles() {
        return ["MMM-AssistTouch.css"];
    },

    getScripts() {
        return ["vendor/hammer.min.js"];
    },

    suspend() {
        this._detachGestures();
        this._detachKeyboard();
        this._detachPointerSwipe();
    },

    resume() {
        this._attachGestures();
        this._attachKeyboard();
        this._attachPointerSwipe();
    },

    getDom() {
        const root = document.createElement("div");
        root.className = "mat-root";

        const now = Date.now();
        const showToast = now < this._toastUntil;

        const toast = document.createElement("div");
        toast.className = `mat-toast ${showToast ? "mat-toast--show" : ""}`;
        toast.textContent = this.activeScreen();
        root.appendChild(toast);

        if (this.config.showScreenIndicator) {
            const indicator = document.createElement("div");
            indicator.className = `mat-indicator mat-indicator--${this.config.screenIndicatorPosition}`;

            const tag = this._screens[this.current] || "home";
            const labelMap = this.config.screenIndicatorLabelMap || {};
            indicator.textContent = labelMap[tag] ? labelMap[tag] : String(tag).toUpperCase();

            root.appendChild(indicator);
        }

        return root;
    },

    notificationReceived(notification, payload) {
        if (notification === "DOM_OBJECTS_CREATED") {
            this._attachGestures();
            this._attachKeyboard();
            this._attachPointerSwipe();
            this.applyScreen(true);
            this.updateDom(0);
            return;
        }

        if (notification === "REMOTE_ALERT_SENT" && payload && payload.alertId) {
            this._simpleRemoteActive = true;
            return;
        }

        if (notification === "REMOTE_ALERT_ACK" && payload && payload.alertId) {
            this._simpleRemoteActive = false;
            return;
        }

        if (notification === "ASSIST_TOUCH_NEXT_SCREEN") {
            this._onSwipeDown();
            return;
        }

        if (notification === "ASSIST_SCREEN_SET" && payload && payload.screen) {
            const idx = this._screens.indexOf(String(payload.screen));
            if (idx >= 0) {
                this.current = idx;
                this.applyScreen(false);
                this._toast();
            }
            return;
        }
    },

    activeScreen() {
        return this._screens[this.current] || String(this.config.homeScreen || "home");
    },

    _attachGestures() {
        if (this._hammer) return;

        if (!window.Hammer) {
            console.warn("[MMM-AssistTouch] HammerJS not available (window.Hammer missing).");
            return;
        }

        const hammer = new window.Hammer(document.body);

        hammer.get("swipe").set({
            direction: window.Hammer.DIRECTION_VERTICAL,
            threshold: 10,
            velocity: 0.15
        });

        hammer.get("press").set({ time: Number(this.config.longPressMs) || 650 });

        hammer.on("swipedown", () => {
            if (this.config.debugGestures) console.log("[MMM-AssistTouch] swipedown");
            this._onSwipeDown();
        });

        hammer.on("press", () => {
            if (this.config.debugGestures) console.log("[MMM-AssistTouch] press");
            this._onLongPress();
        });

        this._hammer = hammer;
    },

    _detachGestures() {
        if (!this._hammer) return;
        try { this._hammer.destroy(); } catch (_) {}
        this._hammer = null;
    },

    _attachKeyboard() {
        if (!this.config.enableKeyboard) return;
        if (this._onKeyDown) return;

        this._onKeyDown = (e) => {
            const t = e.target && e.target.tagName ? String(e.target.tagName).toLowerCase() : "";
            if (t === "input" || t === "textarea" || t === "select") return;

            const key = e.key;
            const nextKeys = new Set((this.config.keyNext || []).map(String));
            const homeKeys = new Set((this.config.keyHome || []).map(String));

            if (nextKeys.has(key)) {
                e.preventDefault();
                this._onSwipeDown();
                return;
            }

            if (homeKeys.has(key)) {
                e.preventDefault();
                this._onLongPress();
            }
        };

        window.addEventListener("keydown", this._onKeyDown, { passive: false });
    },

    _detachKeyboard() {
        if (!this._onKeyDown) return;
        window.removeEventListener("keydown", this._onKeyDown);
        this._onKeyDown = null;
    },


    _attachPointerSwipe() {
        if (!this.config.enablePointerSwipe) return;
        if (this._onPtrDown) return;

        const threshold = Number(this.config.pointerSwipeThresholdPx) || 120;
        const slop = Number(this.config.pointerSwipeSlopPx) || 8;
        const maxMs = Number(this.config.pointerSwipeMaxMs) || 900;
        const btn = Number.isFinite(Number(this.config.pointerSwipeButton)) ? Number(this.config.pointerSwipeButton) : 0;

        this._onPtrDown = (e) => {
            // left mouse only; allow touch/pen (button often 0 there too)
            if (typeof e.button === "number" && e.button !== btn) return;
            // ignore right click etc
            if (e.isPrimary === false) return;

            this._ptr.active = true;
            this._ptr.id = e.pointerId;
            this._ptr.x0 = e.clientX;
            this._ptr.y0 = e.clientY;
            this._ptr.t0 = Date.now();
        };

        this._onPtrMove = (e) => {
            if (!this._ptr.active) return;
            if (this._ptr.id !== null && e.pointerId !== this._ptr.id) return;

            const dx = e.clientX - this._ptr.x0;
            const dy = e.clientY - this._ptr.y0;
            const dt = Date.now() - this._ptr.t0;

            // ignore tiny jitter
            if (Math.abs(dx) < slop && Math.abs(dy) < slop) return;

            // trigger only on clear downward drag
            if (dy >= threshold && dt <= maxMs) {
                this._ptr.active = false;
                this._ptr.id = null;
                if (this.config.debugGestures) console.log("[MMM-AssistTouch] pointer drag down -> next screen");
                this._onSwipeDown();
            }
        };

        this._onPtrUp = (e) => {
            if (!this._ptr.active) return;
            if (this._ptr.id !== null && e.pointerId !== this._ptr.id) return;
            this._ptr.active = false;
            this._ptr.id = null;
        };


        document.addEventListener("pointerdown", this._onPtrDown, true);
        document.addEventListener("pointermove", this._onPtrMove, true);
        document.addEventListener("pointerup", this._onPtrUp, true);
        document.addEventListener("pointercancel", this._onPtrUp, true);
    },

    _detachPointerSwipe() {
        if (!this._onPtrDown) return;
        document.removeEventListener("pointerdown", this._onPtrDown, true);
        document.removeEventListener("pointermove", this._onPtrMove, true);
        document.removeEventListener("pointerup", this._onPtrUp, true);
        document.removeEventListener("pointercancel", this._onPtrUp, true);
        this._onPtrDown = null;
        this._onPtrMove = null;
        this._onPtrUp = null;
        this._ptr.active = false;
        this._ptr.id = null;
    },

    _shouldBlockSwipe() {
        return !!(this.config.blockSwipeWhenSimpleRemoteActive && this._simpleRemoteActive);
    },

    _shouldBlockLongPress() {
        return !!(this.config.blockLongPressWhenSimpleRemoteActive && this._simpleRemoteActive);
    },

    _onSwipeDown() {
        if (this._shouldBlockSwipe()) return;

        const now = Date.now();
        if (now - this._lastSwipeAt < this.config.cooldownMs) return;
        this._lastSwipeAt = now;

        this.current = (this.current + 1) % this._screens.length;
        this.applyScreen(false);
        this._toast();
    },

    _onLongPress() {
        if (this._shouldBlockLongPress()) return;

        const home = String(this.config.homeScreen || "home");
        const idx = this._screens.indexOf(home);
        if (idx < 0) return;
        if (this.current === idx) return;

        this.current = idx;
        this.applyScreen(false);
        this._toast();
    },

    _toast() {
        this._toastUntil = Date.now() + (Number(this.config.toastMs) || 1200);
        this.updateDom(0);
        setTimeout(() => this.updateDom(0), (Number(this.config.toastMs) || 1200) + 30);
    },

    applyScreen(isInitial) {
        const activeTag = this.activeScreen();
        const lock = String(this.config.lockString || "MMM-AssistTouch");
        const ms = Number(this.config.animationMs) || 0;

        this._storeScreen(activeTag);

        const excluded = new Set(
            (Array.isArray(this.config.excludedModules) ? this.config.excludedModules : []).map(String)
        );
        excluded.add(this.name);

        MM.getModules().enumerate((m) => {
            if (excluded.has(m.name)) return;

            const tags = this._getScreenTagsFor(m);
            if (!tags) return;

            if (tags.includes(activeTag)) m.show(isInitial ? 0 : ms, { lockString: lock });
            else m.hide(isInitial ? 0 : ms, { lockString: lock });
        });

        this.sendNotification("ASSIST_SCREEN_CHANGED", {
            screen: activeTag,
            initial: !!isInitial,
            at: Date.now()
        });

        this.updateDom(0);
    },

    _getScreenTagsFor(moduleInstance) {
        const tags = moduleInstance.config && Array.isArray(moduleInstance.config.screenTags)
            ? moduleInstance.config.screenTags.map(String)
            : null;

        if (tags && tags.length) return tags;

        if (this.config.managedByDefault) return [String(this.config.defaultTag || "home")];
        return null;
    },

    _storeScreen(screen) {
        try { window.localStorage.setItem(String(this.config.storageKey), String(screen)); } catch (_) {}
    },

    _loadStoredScreen() {
        try { return window.localStorage.getItem(String(this.config.storageKey)); } catch (_) { return null; }
    }
});