import { Plugin } from "@webiny/plugins";
import { Context } from "~/types";

export interface BeforeHandlerCallable<T extends Context = Context> {
    (context: T): void | Promise<void>;
}

export class BeforeHandlerPlugin<T extends Context = Context> extends Plugin {
    public static readonly type: string = "before-handler";
    private readonly _callable: BeforeHandlerCallable<T>;

    constructor(callable?: BeforeHandlerCallable<T>) {
        super();
        this._callable = callable;
    }

    apply(context: T): void | Promise<void> {
        if (typeof this._callable !== "function") {
            throw Error(
                `Missing callable in BeforeHandlerPlugin! Either pass a callable to plugin constructor or extend the plugin and override the "apply" method.`
            );
        }

        return this._callable(context);
    }
}
