/* global Module */

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

        // If MMM-SimpleRemote is visible don't switch screens on swipe.
        blockSwipeWhenSimpleRemoteActive: true,


        blockLongPressWhenSimpleRemoteActive: false
    },

    start() {
        this._hammer = null;
        this._lastSwipeAt = 0;
        this._toastUntil = 0;

        this._screens = Array.isArray(this.config.screens) && this.config.screens.length
            ? this.config.screens.map(String)
            : ["home"];

        this._simpleRemoteActive = false;

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
        return ["node_modules/hammerjs/hammer.min.js"];
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

        return root;
    },

    notificationReceived(notification, payload) {
        if (notification === "DOM_OBJECTS_CREATED") {
            this._attachGestures();
            this.applyScreen(true);
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
    },

    activeScreen() {
        return this._screens[this.current] || String(this.config.homeScreen || "home");
    },

    _attachGestures() {
        if (this._hammer || !window.Hammer) return;

        const hammer = new window.Hammer(document.body);
        hammer.get("swipe").set({ direction: window.Hammer.DIRECTION_VERTICAL });
        hammer.get("press").set({ time: Number(this.config.longPressMs) || 650 });

        hammer.on("swipedown", () => this._onSwipeDown());
        hammer.on("press", () => this._onLongPress());

        this._hammer = hammer;
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
            (Array.isArray(this.config.excludedModules) ? this.config.excludedModules : [])
                .map(String)
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
        try {
            window.localStorage.setItem(String(this.config.storageKey), String(screen));
        } catch (_) {}
    },

    _loadStoredScreen() {
        try {
            return window.localStorage.getItem(String(this.config.storageKey));
        } catch (_) {
            return null;
        }
    }
});