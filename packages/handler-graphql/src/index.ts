import { HandlerGraphQLOptions } from "./types";
import createGraphQLHandler from "./createGraphQLHandler";
import { Context } from "@webiny/handler/types";

export const composeResolvers = <
    TSource = Record<string, any>,
    TArgs = Record<string, any>,
    TContext = Context
>(
    ...fns: ((source: TSource, args: TArgs, context: TContext) => any)[]
): any => {
    return async (source: TSource, args: TArgs, context: TContext) => {
        let result;
        for (let i = 0; i < fns.length; i++) {
            const fn = fns[i];
            result = await fn(source, args, context);
        }
        return result;
    };
};

export default (options: HandlerGraphQLOptions = {}) => [createGraphQLHandler(options)];
