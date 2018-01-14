function logError(e) {
    console.error(e);
}

class Dispatcher {

    constructor() {
        this.listeners = {};
    }

    dispatch(event, data) {
        // console.info('%c[Dispatch]: ' + event, 'color: #1918DE; font-weight: bold', data);
        if (!this.listeners.hasOwnProperty(event)) {
            return Promise.resolve(null);
        }

        // Execute before change callbacks in a chain
        let callbacksChain = Promise.resolve(data);

        this.listeners[event].forEach(listener => {
            callbacksChain = callbacksChain.then(res => listener.listener(res)).catch(logError);
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
export default new Dispatcher();
