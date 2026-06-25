import { Container } from "@webiny/di";
import { RequestContainer } from "@webiny/event-handler-core";
import { GraphQLSchemaComposer as Abstraction } from "./abstractions.js";
import { GraphQLSchemaFactory, CoreGraphQLSchemaFactory } from "~/graphql/abstractions.js";
import { GraphQLSchemaBuilder } from "./GraphQLSchemaBuilder.js";
import type { IGraphQLSchema } from "~/graphql/abstractions.public.js";

class GraphQLSchemaComposerImpl implements Abstraction.Interface {
    constructor(private container: Container) {}

    async build(ctx?: Record<string, any>): Promise<IGraphQLSchema> {
        const builder = new GraphQLSchemaBuilder();

        // Resolve lazily so factories registered during enhance() (e.g. by extensions) are included.
        const coreSchemas = this.container.resolveAll(CoreGraphQLSchemaFactory);
        const userSchemas = this.container.resolveAll(GraphQLSchemaFactory);

        for (const factory of coreSchemas) {
            await factory.execute(builder, ctx);
        }

        for (const factory of userSchemas) {
            await factory.execute(builder);
        }

        return builder.build();
    }
}

export const GraphQLSchemaComposer = Abstraction.createImplementation({
    implementation: GraphQLSchemaComposerImpl,
    dependencies: [RequestContainer]
});
