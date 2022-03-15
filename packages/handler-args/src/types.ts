import { Context } from "@webiny/handler/types";

export interface ArgsContext<TArgs = Record<string, any>> extends Context {
    invocationArgs: TArgs;
}
