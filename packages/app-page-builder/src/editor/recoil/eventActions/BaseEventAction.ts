import { EventAction, EventActionOptionsType } from "./EventAction";

export abstract class BaseEventAction<T extends object> implements EventAction<T> {
    private readonly _args: T;
    private readonly _options: EventActionOptionsType;

    public constructor(args: T, options?: EventActionOptionsType) {
        this._args = args;
        this._options = options;
    }

    public getName(): string {
        return this.constructor.name;
    }

    public getArgs(): T {
        return this._args;
    }

    public getOptions(): EventActionOptionsType {
        return this._options;
    }
}
