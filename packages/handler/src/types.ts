import { Plugin, PluginsContainer } from "@webiny/plugins/types";

export type HandlerArgs = any[];

export type Context<
    C0 = Record<string, any>,
    C1 = Record<string, any>,
    C2 = Record<string, any>,
    C3 = Record<string, any>,
    C4 = Record<string, any>,
    C5 = Record<string, any>,
    C6 = Record<string, any>,
    C7 = Record<string, any>,
    C8 = Record<string, any>,
    C9 = Record<string, any>
> = {
    plugins: PluginsContainer;
    args: HandlerArgs;
    [key: string]: any;
} & C0 &
    C1 &
    C2 &
    C3 &
    C4 &
    C5 &
    C6 &
    C7 &
    C8 &
    C9;

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
    apply(context: C0 & C1 & C2 & C3 & C4 & C5 & C6 & C7 & C8 & C9): void;
};

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
