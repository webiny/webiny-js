import { Plugin } from "@webiny/plugins";
import { Context } from "~/types";

export interface HandlerErrorCallable<T extends Context = Context> {
    (context: T, error: Error, next: Function): Promise<any>;
}

export class HandlerErrorPlugin<T extends Context = Context> extends Plugin {
    public static readonly type: string = "handler-error";

    private readonly _callable: HandlerErrorCallable<T>;

    public constructor(callable: HandlerErrorCallable<T>) {
        super();
        this._callable = callable;
    }

    public async handle(context: T, error: Error, next: Function): Promise<any> {
        return this._callable(context, error, next);
    }
}
