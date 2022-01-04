import { Plugin } from "@webiny/plugins";
import { Context } from "~/types";

export interface HandleResult<T extends Context = Context> {
    (context: T, result: any): Promise<any>;
}

export class HandlerResultPlugin<T extends Context = Context> extends Plugin {
    public static readonly type: string = "handler-result";

    private readonly _handle: HandleResult;

    public constructor(handle: HandleResult) {
        super();
        this._handle = handle;
    }

    async handle(context: T, result: any): Promise<any> {
        return this._handle(context, result);
    }
}
