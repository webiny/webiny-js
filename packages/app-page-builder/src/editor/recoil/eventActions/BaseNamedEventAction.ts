import { BaseEventAction } from "@webiny/app-page-builder/editor/recoil/eventActions/BaseEventAction";

export abstract class BaseNamedEventAction<T extends object> extends BaseEventAction<T> {
    private readonly _name: string;

    protected constructor(name: string, args: T) {
        super(args);
        this._name = name;
    }

    public getName(): string {
        return this._name;
    }
}
