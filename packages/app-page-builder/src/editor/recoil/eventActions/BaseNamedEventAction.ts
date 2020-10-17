import { BaseEventAction, BaseEventOptionsType } from "./BaseEventAction";

export abstract class BaseNamedEventAction<T extends object> extends BaseEventAction<T> {
    private readonly _name: string;

    public constructor(name: string, args: T, options?: BaseEventOptionsType) {
        super(args, options);
        this._name = name;
    }

    public getName(): string {
        return this._name;
    }
}
