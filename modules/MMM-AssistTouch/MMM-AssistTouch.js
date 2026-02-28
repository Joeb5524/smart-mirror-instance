/* global Module */

Module.register("MMM-AssistTouch", {
    defaults: {
        screens: ["home", "meds"],
        startScreen: "home",
        lockString: "MMM-AssistTouch",
        animationMs: 0,
        cooldownMs: 800
    },

    start() {
        this.current = this._clampIndex(this.config.screens.indexOf(this.config.startScreen));
        this._lastSwipeAt = 0;
        this._hammer = null;
    },

    getStyles() {
        return ["MMM-AssistTouch.css"];
    },

    getScripts() {
        return ["vendor/hammer.min.js"];
    },

    getDom() {
        const el = document.createElement("div");
        el.className = "mat-root";
        return el;
    },

    notificationReceived(notification) {
        if (notification === "DOM_OBJECTS_CREATED") {
            this._attachSwipe();
            this._applyScreen();
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

        this.current = (this.current + 1) % this.config.screens.length;
        this._applyScreen();
    },

    _applyScreen() {
        const activeTag = this.config.screens[this.current];
        const lock = this.config.lockString;
        const ms = Number(this.config.animationMs) || 0;

        MM.getModules().enumerate((m) => {
            if (m.name === this.name) return;

            const tags = (m.config && Array.isArray(m.config.screenTags)) ? m.config.screenTags : null;
            if (!tags) return; // not managed

            if (tags.includes(activeTag)) m.show(ms, { lockString: lock });
            else m.hide(ms, { lockString: lock });
        });
    },

    _clampIndex(i) {
        return i >= 0 ? i : 0;
    }
});