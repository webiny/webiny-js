import { Context } from "@webiny/handler/types";
import { GraphQLFieldResolver } from "./types";

export const compose = <TSource = any, TArgs = Record<string, any>, TContext = Context>(...fns) => (
    resolver: GraphQLFieldResolver<TSource, TArgs, TContext>
) => fns.reduceRight((v, f) => f(v), resolver);
