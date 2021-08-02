import { HandlerGraphQLOptions } from "./types";
import createGraphQLHandler from "./createGraphQLHandler";
import { Context } from "@webiny/handler/types";
import { GraphQLFieldResolver } from "./types";

export * from "./errors";
export * from "./responses";

export default (options: HandlerGraphQLOptions = {}) => [createGraphQLHandler(options)];

export const pipe =
    <TSource = any, TArgs = Record<string, any>, TContext = Context>(...fns) =>
    (resolver: GraphQLFieldResolver<TSource, TArgs, TContext>) =>
        fns.reduce((v, f) => f(v), resolver);

export const compose =
    <TSource = any, TArgs = Record<string, any>, TContext = Context>(...fns) =>
    (resolver: GraphQLFieldResolver<TSource, TArgs, TContext>) =>
        fns.reduceRight((v, f) => f(v), resolver);
