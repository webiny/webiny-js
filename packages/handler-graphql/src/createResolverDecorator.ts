import { ResolverDecorator } from "./types";

export const createResolverDecorator = <TSource = any, TContext = any, TArgs = any>(
    decorator: ResolverDecorator<TSource, TContext, TArgs>
) => {
    return decorator;
};
