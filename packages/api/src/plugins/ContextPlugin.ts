import { Plugin } from "@webiny/plugins";
import { Context } from "~/types";

export interface ContextPluginCallable<T extends Context = Context> {
    (context: T): void | Promise<void>;
}

export class ContextPlugin<T extends Context = Context> extends Plugin {
    public static override readonly type: string = "context";
    private readonly _callable: ContextPluginCallable<T>;

    constructor(callable: ContextPluginCallable<T>) {
        super();
        this._callable = callable;
    }

    public async apply(context: T): Promise<void> {
        if (typeof this._callable !== "function") {
            throw Error(
                `Missing callable in ContextPlugin! Either pass a callable to plugin constructor or extend the plugin and override the "apply" method.`
            );
        }

        return this._callable(context);
    }
}

export const createContextPlugin = <T extends Context = Context>(
    callable: ContextPluginCallable<T>
): ContextPlugin<T> => {
    return new ContextPlugin<T>(callable);
};
