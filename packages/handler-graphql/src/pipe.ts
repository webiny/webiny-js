import { Context } from "@webiny/handler/types";
import { GraphQLFieldResolver } from "./types";

export const pipe = <TSource = any, TArgs = Record<string, any>, TContext = Context>(...fns) => (
    resolver: GraphQLFieldResolver<TSource, TArgs, TContext>
) => fns.reduce((v, f) => f(v), resolver);
