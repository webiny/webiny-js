import { EventAction, EventActionOptionsType } from "./EventAction";

export abstract class BaseEventAction<T extends object = any> implements EventAction<T> {
    private readonly _args: T;
    private readonly _options: EventActionOptionsType;

    public constructor(args?: T, options?: EventActionOptionsType) {
        this._args = args as unknown as T;
        this._options = options || {};
    }

    abstract getName(): string;

    public getArgs(): T {
        return this._args;
    }

    public getOptions(): EventActionOptionsType {
        return this._options;
    }
}
