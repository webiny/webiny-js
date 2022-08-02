import { Context } from "@webiny/handler-old/types";

export interface ArgsContext<TArgs = Record<string, any>> extends Context {
    invocationArgs: TArgs;
}
