"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

/**
 * @private
 */
class EventHandler {
    constructor(name, callback) {
        this.name = name;
        this.callback = callback;
        this.executed = false;
        this.once = false;
    }

    execute(params) {
        if (this.getOnce() && this.executed) {
            return;
        }

        this.executed = true;
        return this.getCallback()(params);
    }

    getName() {
        return this.name;
    }

    getCallback() {
        return this.callback;
    }

    setOnce(flag = true) {
        this.once = flag;
        return this;
    }

    getOnce() {
        return this.once;
    }
}

exports.default = EventHandler;
//# sourceMappingURL=eventHandler.js.map
