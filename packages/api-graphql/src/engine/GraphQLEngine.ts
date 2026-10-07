import { graphql } from "graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { mergeResolvers } from "@graphql-tools/merge";
import { Container } from "@webiny/di";
import { RequestContainer } from "@webiny/event-handler-core";
import { GraphQLEngine as GraphQLEngineAbstraction } from "./abstractions.js";
import { GraphQLSchemaCache } from "./abstractions.js";
import { createSchemaCacheKey } from "./createSchemaCacheKey.js";
import { GraphQLSchemaComposer } from "~/features/GraphQLSchemaBuilder/abstractions.js";
import { ResolverDecoration } from "~/ResolverDecoration.js";
import { createRequestBody } from "~/createRequestBody.js";
import type { IGraphQLSchemaComposer } from "~/features/GraphQLSchemaBuilder/abstractions.js";
import type { IGraphQLSchema } from "~/graphql/abstractions.public.js";
import type { GraphQLRequestBody } from "~/types.js";
import type { GraphQLSchema } from "graphql";

const buildStaticSchema = (schemaConfig: IGraphQLSchema): GraphQLSchema => {
    const resolverDecoration = new ResolverDecoration();
    if (schemaConfig.resolverDecorators) {
        resolverDecoration.addDecorators(schemaConfig.resolverDecorators);
    }

    // Always provide base root types so that `extend type Query/Mutation` works without
    // requiring callers to define them. With assumeValidSDL:true, empty base types are
    // allowed at build time; graphql() then returns schema-validation errors at execution
    // time (e.g. "Type Query must define one or more fields.") when no fields are registered.
    const typeDefs = `type Query\ntype Mutation\n${schemaConfig.typeDefs ?? ""}`;
    const resolvers = mergeResolvers([schemaConfig.resolvers ?? {}]);

    return makeExecutableSchema({
        typeDefs,
        resolvers: resolverDecoration.decorateResolvers(resolvers),
        assumeValidSDL: true,
        inheritResolversFromInterfaces: true,
        // The schema built from typeDefs above is new and nothing else holds it, so resolvers go
        // onto it directly. Without this, graphql-tools rebuilds the whole schema to attach them,
        // which was about half of the schema build on a cold Lambda.
        updateResolversInPlace: true
    });
};

const composeAndBuild = async (composer: IGraphQLSchemaComposer): Promise<GraphQLSchema> => {
    const schemaConfig = await composer.build();
    return buildStaticSchema(schemaConfig);
};

class GraphQLEngineImpl implements GraphQLEngineAbstraction.Interface {
    constructor(
        private composer: IGraphQLSchemaComposer,
        private container: Container,
        private schemaCache: GraphQLSchemaCache.Interface | undefined
    ) {}

    async execute(body: any): Promise<any> {
        const ctx: Record<string, any> = { container: this.container };
        const schema = await this.resolveSchema();
        const parsed = createRequestBody(body);

        if (!Array.isArray(parsed)) {
            return this.executeOne(parsed, schema, ctx);
        }
        // Run sequentially so per-request state (e.g. ctx.debug.logs) is scoped per query.
        const results = [];
        for (const b of parsed) {
            results.push(await this.executeOne(b, schema, ctx));
        }
        return results;
    }

    /**
     * The same composer output always builds the same executable schema, so with a cache in the
     * root container it's built once and reused. When every schema factory has a schema key, the key
     * comes from those and the factories only run on a cache miss. Otherwise they run on every
     * request, and the key comes from what they produced.
     */
    private async resolveSchema(): Promise<GraphQLSchema> {
        if (!this.schemaCache) {
            return composeAndBuild(this.composer);
        }

        const factoriesKey = await this.composer.getSchemaKey();
        if (factoriesKey) {
            return this.schemaCache.getOrBuild(`factories:${factoriesKey}`, () => {
                return composeAndBuild(this.composer);
            });
        }

        const schemaConfig = await this.composer.build();
        const contentKey = createSchemaCacheKey(schemaConfig);
        return this.schemaCache.getOrBuild(`content:${contentKey}`, async () => {
            return buildStaticSchema(schemaConfig);
        });
    }

    private async executeOne(
        body: GraphQLRequestBody,
        schema: GraphQLSchema,
        ctx: Record<string, any>
    ): Promise<any> {
        const { query, variables, operationName } = body;

        return graphql({
            schema,
            source: query,
            rootValue: {},
            contextValue: ctx,
            variableValues: variables ?? undefined,
            operationName: operationName ?? undefined
        });
    }
}

export const GraphQLEngine = GraphQLEngineAbstraction.createImplementation({
    implementation: GraphQLEngineImpl,
    dependencies: [
        GraphQLSchemaComposer,
        RequestContainer,
        [GraphQLSchemaCache, { optional: true }]
    ]
});
