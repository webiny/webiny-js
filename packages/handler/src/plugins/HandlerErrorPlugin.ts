import { Plugin } from "@webiny/plugins";
import { Context } from "~/types";

export interface HandleError<T extends Context = Context> {
    (context: T, error: Error, next: Function): Promise<any>;
}

export class HandlerErrorPlugin<T extends Context = Context> extends Plugin {
    public static readonly type: string = "handler-error";

    private readonly _handle: HandleError;

    public constructor(handle: HandleError) {
        super();
        this._handle = handle;
    }

    async handle(context: T, error: Error, next: Function): Promise<any> {
        return this._handle(context, error, next);
    }
}
