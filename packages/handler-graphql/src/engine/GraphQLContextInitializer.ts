import { createAbstraction } from "@webiny/feature/api";

/**
 * A per-request initializer that runs AFTER context enhancers and BEFORE contextual schemas
 * (and schema execution). Use it for request-scoped setup that registers things into the
 * container — e.g. the Headless CMS facade, storage operations, AccessControl — which the
 * contextual schemas and resolvers then depend on.
 *
 * Unlike GraphQLContextualSchema, an initializer contributes NO schema content; its only
 * product is the side effect of init(ctx). Previously this was done by hijacking
 * GraphQLContextualSchema.build() and returning a throwaway "type Query / type Mutation"
 * schema purely to satisfy the interface — this abstraction makes that intent explicit and
 * removes the empty-schema ceremony.
 */
export interface IGraphQLContextInitializer {
    init(ctx: Record<string, any>): void | Promise<void>;
}

export const GraphQLContextInitializer = createAbstraction<IGraphQLContextInitializer>(
    "GraphQLContextInitializer"
);

export namespace GraphQLContextInitializer {
    export type Interface = IGraphQLContextInitializer;
}
