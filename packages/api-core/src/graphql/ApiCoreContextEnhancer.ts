import { Container } from "@webiny/di";
import { GraphQLContextualSchema } from "@webiny/handler-graphql";
import { RequestContainer } from "@webiny/event-handler-core";
import { makeExecutableSchema } from "@graphql-tools/schema";
import type { GraphQLSchema } from "graphql";
import { WcpFeature } from "~/features/wcp/WcpFeature.js";
import { loadWcpLicense } from "~/legacy/wcp/context.js";
import type { IGraphQLContextualSchema } from "@webiny/handler-graphql";

export class ApiCoreInitializerImpl implements IGraphQLContextualSchema {
    private initialized = false;

    constructor(private container: Container) {}

    async build(_ctx: Record<string, any>): Promise<GraphQLSchema> {
        if (!this.initialized) {
            this.initialized = true;
            const license = await loadWcpLicense();
            WcpFeature.register(this.container, license);
        }
        return makeExecutableSchema({
            typeDefs: "type Query\ntype Mutation",
            assumeValidSDL: true
        });
    }
}

export const ApiCoreContextualSchema = GraphQLContextualSchema.createImplementation({
    implementation: ApiCoreInitializerImpl,
    dependencies: [RequestContainer]
});
