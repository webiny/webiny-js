import { Plugin } from "@webiny/plugins";
import { Context } from "~/types";

export interface HandlerCallable<T extends Context = Context> {
    (context: T, next: Function): Promise<any>;
}

export class HandlerPlugin<T extends Context = Context> extends Plugin {
    public static readonly type: string = "handler";

    private readonly _callable: HandlerCallable<T>;

    public constructor(callable: HandlerCallable<T>) {
        super();
        this._callable = callable;
    }

    public async handle(context: T, next: Function): Promise<any> {
        return this._callable(context, next);
    }
}
