class Event {
    constructor() {
        this.stopped = false;
    }

    stop() {
        this.stopped = true;
    }

    isStopped() {
        return this.stopped;
    }
}

class Dispatcher {
    constructor() {
        this.listeners = {};
    }

    dispatch(event, data = {}) {
        if (!this.listeners.hasOwnProperty(event)) {
            return Promise.resolve();
        }

        data.$event = new Event();
        let callbacksChain = Promise.resolve();

        this.listeners[event].forEach(listener => {
            callbacksChain = callbacksChain.then(() => {
                if (!data.$event.isStopped()) {
                    return listener.listener(data);
                }
            }).catch(console.error);
        });

        return callbacksChain;
    }

    on(event, listener) {
        if (!this.listeners.hasOwnProperty(event)) {
            this.listeners[event] = [];
        }
        const itemIndex = this.listeners[event].push({listener}) - 1;
        const _this = this;

        return function off() {
            _this.listeners[event][itemIndex] = null;
            _this.listeners[event].splice(itemIndex);
        };
    }

    off(event) {
        const index = this.listeners.indexOf(event);
        if (index > -1) {
            this.listeners.splice(index);
            return true;
        }
        return false;
    }

    getListeners() {
        return this.listeners;
    }
}
module.exports = Dispatcher;
