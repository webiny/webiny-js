import { graphql } from "graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { mergeResolvers } from "@graphql-tools/merge";
import { Container } from "@webiny/di";
import { RequestContainer } from "@webiny/event-handler-core";
import { GraphQLEngine } from "./abstractions.js";
import { GraphQLSchemaComposer } from "~/features/GraphQLSchemaBuilder/abstractions.js";
import { ResolverDecoration } from "~/ResolverDecoration.js";
import { createRequestBody } from "~/createRequestBody.js";
import type { IGraphQLSchemaComposer } from "~/features/GraphQLSchemaBuilder/abstractions.js";
import type { GraphQLRequestBody } from "~/types.js";
import type { GraphQLSchema } from "graphql";

class GraphQLEngineImplClass implements GraphQLEngine.Interface {
    constructor(
        private composer: IGraphQLSchemaComposer,
        private container: Container
    ) {}

    async execute(body: any): Promise<any> {
        const schemaConfig = await this.composer.build();

        const resolverDecoration = new ResolverDecoration();
        if (schemaConfig.resolverDecorators) {
            resolverDecoration.addDecorators(schemaConfig.resolverDecorators);
        }

        const schema = makeExecutableSchema({
            typeDefs: schemaConfig.typeDefs || "type Query { _empty: String }",
            resolvers: resolverDecoration.decorateResolvers(
                mergeResolvers([schemaConfig.resolvers ?? {}])
            ),
            inheritResolversFromInterfaces: true
        });

        const parsed = createRequestBody(body);

        if (Array.isArray(parsed)) {
            return Promise.all(parsed.map(b => this.executeOne(b, schema)));
        }
        return this.executeOne(parsed, schema);
    }

    private async executeOne(body: GraphQLRequestBody, schema: GraphQLSchema): Promise<any> {
        const { query, variables, operationName } = body;
        return graphql({
            schema,
            source: query,
            rootValue: {},
            contextValue: { container: this.container },
            variableValues: variables ?? undefined,
            operationName: operationName ?? undefined
        });
    }
}

export const GraphQLEngineImpl = GraphQLEngine.createImplementation({
    implementation: GraphQLEngineImplClass,
    dependencies: [GraphQLSchemaComposer, RequestContainer]
});
