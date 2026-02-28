/* global Module */

Module.register("MMM-AssistTouch", {
    defaults: {
        screens: ["home", "meds", "care"],
        startScreen: "home",

        lockString: "MMM-AssistTouch",
        animationMs: 250,
        cooldownMs: 800,

        managedByDefault: false,
        defaultTag: "home",
        excludedModules: ["MMM-AssistTouch"],

        toastMs: 1200
    },

    start() {
        this._hammer = null;
        this._lastSwipeAt = 0;
        this._toastUntil = 0;

        this._screens = Array.isArray(this.config.screens) && this.config.screens.length
            ? this.config.screens.map(String)
            : ["home"];

        const startIdx = this._screens.indexOf(String(this.config.startScreen));
        this.current = startIdx >= 0 ? startIdx : 0;
    },

    getStyles() {
        return ["MMM-AssistTouch.css"];
    },

    getScripts() {
        return ["vendor/hammer.min.js"];
    },

    getDom() {
        const root = document.createElement("div");
        root.className = "mat-root";

        const now = Date.now();
        const showToast = now < this._toastUntil;

        const toast = document.createElement("div");
        toast.className = `mat-toast ${showToast ? "mat-toast--show" : ""}`;
        toast.textContent = this._screens[this.current] || "";
        root.appendChild(toast);

        return root;
    },

    notificationReceived(notification) {
        if (notification === "DOM_OBJECTS_CREATED") {
            this._attachSwipe();
            this.applyScreen();
        }
    },

    _attachSwipe() {
        if (this._hammer || !window.Hammer) return;

        this._hammer = new window.Hammer(document.body);
        this._hammer.get("swipe").set({ direction: window.Hammer.DIRECTION_VERTICAL });

        this._hammer.on("swipedown", () => this._onSwipeDown());
    },

    _onSwipeDown() {
        const now = Date.now();
        if (now - this._lastSwipeAt < this.config.cooldownMs) return;
        this._lastSwipeAt = now;

        this.current = (this.current + 1) % this._screens.length;
        this.applyScreen();
        this._showToast();
    },

    _showToast() {
        this._toastUntil = Date.now() + (Number(this.config.toastMs) || 1200);
        this.updateDom(0);

        setTimeout(() => {
            this.updateDom(0);
        }, (Number(this.config.toastMs) || 1200) + 30);
    },

    applyScreen() {
        const activeTag = this._screens[this.current];
        const lock = this.config.lockString;
        const ms = Number(this.config.animationMs) || 0;

        const excluded = new Set(
            (Array.isArray(this.config.excludedModules) ? this.config.excludedModules : [])
                .map(String)
        );
        excluded.add(this.name);

        MM.getModules().enumerate((m) => {
            if (excluded.has(m.name)) return;

            const tags = this._getScreenTagsFor(m);
            if (!tags) return;

            if (tags.includes(activeTag)) m.show(ms, { lockString: lock });
            else m.hide(ms, { lockString: lock });
        });
    },

    _getScreenTagsFor(moduleInstance) {
        const tags = moduleInstance.config && Array.isArray(moduleInstance.config.screenTags)
            ? moduleInstance.config.screenTags.map(String)
            : null;

        if (tags && tags.length) return tags;

        if (this.config.managedByDefault) return [String(this.config.defaultTag || "home")];
        return null;
    }
});