import { Plugin } from "@webiny/plugins";
import { ContextInterface } from "~/types";

interface Callable<T extends ContextInterface = ContextInterface> {
    (context: T): void | Promise<void>;
}

export class ContextPlugin<T extends ContextInterface = ContextInterface> extends Plugin {
    public static readonly type = "context";
    private readonly _callable: Callable<T>;

    constructor(callable?: Callable<T>) {
        super();
        this._callable = callable;
    }

    apply(context: T): void | Promise<void> {
        if (typeof this._callable !== "function") {
            throw Error(
                `Missing callable in ContextPlugin! Either pass a callable to plugin constructor or extend the plugin and override the "apply" method.`
            );
        }

        return this._callable(context);
    }
}
