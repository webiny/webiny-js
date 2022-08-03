import { HandlerGraphQLOptions } from "./types";
import createGraphQLHandler from "./createGraphQLHandler";
import { Context } from "@webiny/api/types";
import { GraphQLFieldResolver } from "./types";

/**
 * Can be anything.
 * TODO: Figure out if required at all.
 */
interface Callable {
    (params: any): any;
}
export * from "./errors";
export * from "./responses";

export default (options: HandlerGraphQLOptions = {}) => [createGraphQLHandler(options)];

export const pipe =
    <TSource = any, TArgs = Record<string, any>, TContext = Context>(...fns: Callable[]) =>
    (resolver: GraphQLFieldResolver<TSource, TArgs, TContext>) =>
        fns.reduce((v, f) => f(v), resolver);

export const compose =
    <TSource = any, TArgs = Record<string, any>, TContext = Context>(...fns: Callable[]) =>
    (resolver: GraphQLFieldResolver<TSource, TArgs, TContext>) =>
        fns.reduceRight((v, f) => f(v), resolver);
