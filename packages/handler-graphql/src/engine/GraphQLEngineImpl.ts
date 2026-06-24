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
import type {
    GraphQLAfterQueryPlugin,
    GraphQLBeforeQueryPlugin,
    GraphQLRequestBody
} from "~/types.js";
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
        const bm = ctx.benchmark as
            | { measure?: (name: string, fn: () => Promise<any>) => Promise<any> }
            | undefined;

        // Run contextual schemas BEFORE composer.build() so that any ctx.plugins registrations
        // they make (e.g. ACO folder schema plugins) are visible to GraphQLSchemaComposer,
        // which reads ctx.plugins.byType("graphql-schema") during build.
        const extraSchemas = await this.buildContextualSchemas(ctx);

        const schemaConfig = await this.composer.build(ctx);

        const resolverDecoration = new ResolverDecoration();
        if (schemaConfig.resolverDecorators) {
            resolverDecoration.addDecorators(schemaConfig.resolverDecorators);
        }

        // Always provide base root types so that `extend type Query/Mutation` works without
        // requiring callers to define them. With assumeValidSDL:true, empty base types are
        // allowed at build time; graphql() then returns schema-validation errors at execution
        // time (e.g. "Type Query must define one or more fields.") when no fields are registered.
        const typeDefs = `type Query\ntype Mutation\n${schemaConfig.typeDefs ?? ""}`;
        const staticSchema = makeExecutableSchema({
            typeDefs,
            resolvers: resolverDecoration.decorateResolvers(
                mergeResolvers([schemaConfig.resolvers ?? {}])
            ),
            assumeValidSDL: true,
            inheritResolversFromInterfaces: true
        });

        const schema = await (bm?.measure
            ? bm.measure("headlessCms.graphql.getSchema", () =>
                  this.buildSchema(staticSchema, extraSchemas)
              )
            : this.buildSchema(staticSchema, extraSchemas));

        const parsed = bm?.measure
            ? ((await bm.measure("headlessCms.graphql.createRequestBody", async () =>
                  createRequestBody(body)
              )) as ReturnType<typeof createRequestBody>)
            : createRequestBody(body);

        const executeAll = async () => {
            if (!Array.isArray(parsed)) {
                return this.executeOne(parsed, schema, ctx);
            }
            // Run sequentially so per-request state (e.g. ctx.debug.logs) is scoped per query.
            const results = [];
            for (const b of parsed) {
                results.push(await this.executeOne(b, schema, ctx));
            }
            return results;
        };

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

    private async buildContextualSchemas(ctx: Record<string, any>): Promise<GraphQLSchema[]> {
        if (this.contextualSchemas.length === 0) {
            return [];
        }
        return Promise.all(this.contextualSchemas.map(s => s.build(ctx)));
    }

    private async buildSchema(
        staticSchema: GraphQLSchema,
        extraSchemas: GraphQLSchema[]
    ): Promise<GraphQLSchema> {
        if (extraSchemas.length === 0) {
            return staticSchema;
        }
        return mergeSchemas({ schemas: [staticSchema, ...extraSchemas] });
    }

    private async executeOne(
        body: GraphQLRequestBody,
        schema: GraphQLSchema,
        ctx: Record<string, any>
    ): Promise<any> {
        const { query, variables, operationName } = body;

        if (ctx.plugins && typeof ctx.plugins.byType === "function") {
            const byType = (ctx.plugins.byType as <T>(type: string) => T[]).bind(ctx.plugins);
            for (const pl of byType<GraphQLBeforeQueryPlugin>("graphql-before-query")) {
                pl.apply({ body, schema, context: ctx as any });
            }
        }

        const result = await graphql({
            schema,
            source: query,
            rootValue: {},
            contextValue: ctx,
            variableValues: variables ?? undefined,
            operationName: operationName ?? undefined
        });

        if (ctx.plugins && typeof ctx.plugins.byType === "function") {
            const byType = (ctx.plugins.byType as <T>(type: string) => T[]).bind(ctx.plugins);
            for (const pl of byType<GraphQLAfterQueryPlugin>("graphql-after-query")) {
                pl.apply({ result, body, schema, context: ctx as any });
            }
        }

        return result;
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
