// @flow

/**
 * @private
 */
class EventHandler {
    name: string;
    callback: Function;
    executed: boolean;
    once: boolean;

    constructor(name: string, callback: Function) {
        this.name = name;
        this.callback = callback;
        this.executed = false;
        this.once = false;
    }

    execute(params: Object): mixed {
        if (this.getOnce() && this.executed) {
            return;
        }

        this.executed = true;
        return this.getCallback()(params);
    }

    getName(): string {
        return this.name;
    }

    getCallback(): Function {
        return this.callback;
    }

    setOnce(flag: boolean = true): this {
        this.once = flag;
        return this;
    }

    getOnce(): boolean {
        return this.once;
    }
}

export default EventHandler;
