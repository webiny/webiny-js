import { createAbstraction } from "@webiny/feature/api";

/**
 * Allows packages to add properties to the GraphQL resolver contextValue.
 * Register implementations to make things like `context.security`, `context.tenancy`
 * available to resolvers alongside the base `context.container`.
 */
export interface IGraphQLContextEnhancer {
    enhance(ctx: Record<string, any>): void | Promise<void>;
}

export const GraphQLContextEnhancer =
    createAbstraction<IGraphQLContextEnhancer>("GraphQLContextEnhancer");

export namespace GraphQLContextEnhancer {
    export type Interface = IGraphQLContextEnhancer;
}
