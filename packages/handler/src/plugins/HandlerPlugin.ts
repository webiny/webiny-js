import { Plugin } from "@webiny/plugins";
import { Context } from "~/types";

export interface Handle<T extends Context = Context> {
    (context: T, next: Function): Promise<any>;
}

export class HandlerPlugin<T extends Context = Context> extends Plugin {
    public static readonly type: string = "handler";

    private readonly _handle: Handle;

    public constructor(handle: Handle) {
        super();
        this._handle = handle;
    }

    async handle(context: T, next: Function): Promise<any> {
        return this._handle(context, next);
    }
}
