import { Plugin } from "@webiny/plugins";
import { Context } from "~/types";

export interface NextCallable {
    (): Promise<any>;
}

export interface HandlerErrorCallable<T extends Context = Context> {
    (context: T, error: Error, next: NextCallable): Promise<any>;
}

export class HandlerErrorPlugin<T extends Context = Context> extends Plugin {
    public static override readonly type: string = "handler-error";

    private readonly _callable: HandlerErrorCallable<T>;

    public constructor(callable: HandlerErrorCallable<T>) {
        super();
        this._callable = callable;
    }

    public async handle(context: T, error: Error, next: NextCallable): Promise<any> {
        return this._callable(context, error, next);
    }
}

export const createHandlerErrorPlugin = <T extends Context = Context>(
    callable: HandlerErrorCallable<T>
): HandlerErrorPlugin<T> => {
    return new HandlerErrorPlugin<T>(callable);
};
