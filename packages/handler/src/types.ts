import { Plugin, PluginsContainer } from "@webiny/plugins/types";

export type HandlerArgs = any[];

// There are a couple of different types that are used as a base Context type.
// Ultimately, this is the one to be used, the rest are here just for backward-compatibility.
export interface HandlerContext {
    plugins: PluginsContainer;
    args: HandlerArgs;
    readonly WEBINY_VERSION: string;
}

// Left for backwards-compatibility.
export interface Context {
    plugins: PluginsContainer;
    args: HandlerArgs;
    readonly WEBINY_VERSION: string;
    /**
     * Not to be used outside of Webiny internal code.
     * @internal
     */
    hasResult: () => boolean;
    /**
     * Not to be used outside of Webiny internal code.
     * @internal
     *
     * @private
     */
    _result?: any;
    /**
     * Not to be used outside of Webiny internal code.
     * @internal
     */
    setResult: (value: any) => void;
    /**
     * Not to be used outside of Webiny internal code.
     * @internal
     */
    getResult: () => void;
}

/**
 * Left for backwards-compatibility.
 *
 * @internal
 */
export type ContextPlugin<
    C0 = Context,
    C1 = Context,
    C2 = Context,
    C3 = Context,
    C4 = Context,
    C5 = Context,
    C6 = Context,
    C7 = Context,
    C8 = Context,
    C9 = Context
> = Plugin & {
    type: "context";
    apply(context: C0 & C1 & C2 & C3 & C4 & C5 & C6 & C7 & C8 & C9): Promise<void>;
};
/**
 * Left for backwards-compatibility.
 *
 * @internal
 */
export type HandlerPlugin<
    C0 = Context,
    C1 = Context,
    C2 = Context,
    C3 = Context,
    C4 = Context,
    C5 = Context,
    C6 = Context,
    C7 = Context,
    C8 = Context,
    C9 = Context
> = Plugin & {
    type: "handler";
    handle(context: C0 & C1 & C2 & C3 & C4 & C5 & C6 & C7 & C8 & C9, next: Function): any;
};
/**
 * Left for backwards-compatibility.
 *
 * @internal
 */
export type HandlerResultPlugin<
    C0 = Context,
    C1 = Context,
    C2 = Context,
    C3 = Context,
    C4 = Context,
    C5 = Context,
    C6 = Context,
    C7 = Context,
    C8 = Context,
    C9 = Context
> = Plugin & {
    type: "handler-result";
    handle(context: C0 & C1 & C2 & C3 & C4 & C5 & C6 & C7 & C8 & C9, result: any): any;
};
/**
 * Left for backwards-compatibility.
 *
 * @internal
 */
export type HandlerErrorPlugin<
    C0 = Context,
    C1 = Context,
    C2 = Context,
    C3 = Context,
    C4 = Context,
    C5 = Context,
    C6 = Context,
    C7 = Context,
    C8 = Context,
    C9 = Context
> = Plugin & {
    type: "handler-error";
    handle(
        context: C0 & C1 & C2 & C3 & C4 & C5 & C6 & C7 & C8 & C9,
        error: any,
        next: Function
    ): Promise<any>;
};
