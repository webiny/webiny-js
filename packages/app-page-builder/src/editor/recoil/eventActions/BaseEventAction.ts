import { EventAction } from "@webiny/app-page-builder/editor/recoil/eventActions/EventAction";

export type BaseEventOptionsType = {
    isFirst?: boolean;
    isLast?: boolean;
};
export abstract class BaseEventAction<T extends object> implements EventAction<T> {
    private readonly _args: T;
    private readonly _options: BaseEventOptionsType;

    public constructor(args: T, options?: BaseEventOptionsType) {
        this._args = args;
        this._options = options;
    }
    public getArgs(): T {
        return this._args;
    }

    public getName(): string {
        return this.constructor.name;
    }

    public getOptions(): BaseEventOptionsType {
        return this._options;
    }
}
