import { EventAction } from "@webiny/app-page-builder/editor/recoil/eventActions/EventAction";

export abstract class BaseEventAction<T extends object> implements EventAction<T> {
    private readonly _args: T;

    public constructor(args: T) {
        this._args = args;
    }
    public getArgs(): T {
        return this._args;
    }

    public getName(): string {
        return this.constructor.name;
    }
}
