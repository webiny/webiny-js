import { Plugin } from "@webiny/plugins";
import { Context } from "~/types";

export interface HandlerResultCallable<T extends Context = Context> {
    (context: T, result: any): Promise<any>;
}

export class HandlerResultPlugin<T extends Context = Context> extends Plugin {
    public static readonly type: string = "handler-result";

    private readonly _callable: HandlerResultCallable<T>;

    public constructor(callable: HandlerResultCallable<T>) {
        super();
        this._callable = callable;
    }

    async handle(context: T, result: any): Promise<any> {
        return this._callable(context, result);
    }
}
