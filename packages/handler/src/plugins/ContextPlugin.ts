import { Plugin } from "@webiny/plugins";

interface Callable<TContext> {
    (context: TContext): void | Promise<void>;
}

export class ContextPlugin<TContext> extends Plugin {
    public static readonly type = "context";
    private readonly _callable: Callable<TContext>;

    constructor(callable?: Callable<TContext>) {
        super();
        this._callable = callable;
    }

    apply(context: TContext): void | Promise<void> {
        if (typeof this._callable !== "function") {
            throw Error(
                `Missing callable in ContextPlugin! Either pass a callable to plugin constructor or extend the plugin and override the "apply" method.`
            );
        }

        return this._callable(context);
    }
}
