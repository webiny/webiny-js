import { graphql } from "graphql";
import { makeExecutableSchema, mergeSchemas } from "@graphql-tools/schema";
import { mergeResolvers } from "@graphql-tools/merge";
import { Container } from "@webiny/di";
import { RequestContainer } from "@webiny/event-handler-core";
import { GraphQLEngine } from "./abstractions.js";
import { GraphQLContextEnhancer } from "./GraphQLContextEnhancer.js";
import { GraphQLContextualSchema } from "./GraphQLContextualSchema.js";
import { GraphQLSchemaComposer } from "~/features/GraphQLSchemaBuilder/abstractions.js";
import { ResolverDecoration } from "~/ResolverDecoration.js";
import { createRequestBody } from "~/createRequestBody.js";
import type { IGraphQLSchemaComposer } from "~/features/GraphQLSchemaBuilder/abstractions.js";
import type { IGraphQLContextEnhancer } from "./GraphQLContextEnhancer.js";
import type { IGraphQLContextualSchema } from "./GraphQLContextualSchema.js";
import type { GraphQLRequestBody } from "~/types.js";
import type { GraphQLSchema } from "graphql";

class GraphQLEngineImplClass implements GraphQLEngine.Interface {
    constructor(
        private composer: IGraphQLSchemaComposer,
        private container: Container,
        private enhancers: IGraphQLContextEnhancer[],
        private contextualSchemas: IGraphQLContextualSchema[]
    ) {}

    async execute(body: any): Promise<any> {
        // Build context first — enhancers may be async (e.g. CMS storage init)
        const ctx = await this.buildContext();
        const bm = ctx.benchmark as { measure?: (name: string, fn: () => Promise<any>) => Promise<any> } | undefined;
        const schemaConfig = await this.composer.build(ctx);

        const resolverDecoration = new ResolverDecoration();
        if (schemaConfig.resolverDecorators) {
            resolverDecoration.addDecorators(schemaConfig.resolverDecorators);
        }

        const staticSchema = makeExecutableSchema({
            typeDefs: schemaConfig.typeDefs || "type Query { _empty: String }",
            resolvers: resolverDecoration.decorateResolvers(
                mergeResolvers([schemaConfig.resolvers ?? {}])
            ),
            inheritResolversFromInterfaces: true
        });

        const schema = await (bm?.measure
            ? bm.measure("headlessCms.graphql.getSchema", () => this.buildSchema(staticSchema, ctx))
            : this.buildSchema(staticSchema, ctx));

        const parsed = bm?.measure
            ? await bm.measure("headlessCms.graphql.createRequestBody", () =>
                  createRequestBody(body)
              )
            : createRequestBody(body);

        const executeAll = async () =>
            Array.isArray(parsed)
                ? Promise.all(parsed.map(b => this.executeOne(b, schema, ctx)))
                : this.executeOne(parsed, schema, ctx);

        const result = await (bm?.measure
            ? bm.measure("headlessCms.graphql.processRequestBody", executeAll)
            : executeAll());

        // Fire benchmark output callbacks if a benchmark is attached to the context
        if (bm && typeof (bm as any).output === "function") {
            await (bm as any).output();
        }

        return result;
    }

    private async buildContext(): Promise<Record<string, any>> {
        const ctx: Record<string, any> = { container: this.container };
        for (const enhancer of this.enhancers) {
            await enhancer.enhance(ctx);
        }
        return ctx;
    }

    private async buildSchema(
        staticSchema: GraphQLSchema,
        ctx: Record<string, any>
    ): Promise<GraphQLSchema> {
        if (this.contextualSchemas.length === 0) {
            return staticSchema;
        }
        const extra = await Promise.all(this.contextualSchemas.map(s => s.build(ctx)));
        return mergeSchemas({ schemas: [staticSchema, ...extra] });
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

export const GraphQLEngineImpl = GraphQLEngine.createImplementation({
    implementation: GraphQLEngineImplClass,
    dependencies: [
        GraphQLSchemaComposer,
        RequestContainer,
        [GraphQLContextEnhancer, { multiple: true }],
        [GraphQLContextualSchema, { multiple: true }]
    ]
});
