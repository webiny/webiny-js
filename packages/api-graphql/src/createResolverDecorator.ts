import type { ResolverDecorator } from "./types.js";

export const createResolverDecorator = <TSource = any, TContext = any, TArgs = any>(
    decorator: ResolverDecorator<TSource, TContext, TArgs>
) => {
    return decorator;
};
