import { EventAction } from "@webiny/app-page-builder/editor/recoil/eventActions/EventAction";

export abstract class BaseEventAction<T extends any> implements EventAction<T> {
    private readonly _args: T;

    protected constructor(args: T) {
        this._args = args;
    }
    public getArgs(): T {
        return this._args;
    }

    public getName(): string {
        return this.constructor.name;
    }
}
