import { GraphQLSchemaComposer as Abstraction } from "./abstractions.js";
import { GraphQLSchemaFactory, CoreGraphQLSchemaFactory } from "~/graphql/abstractions.js";
import { GraphQLSchemaBuilder } from "./GraphQLSchemaBuilder.js";
import type { IGraphQLSchema } from "~/graphql/abstractions.public.js";

class GraphQLSchemaComposerImpl implements Abstraction.Interface {
    constructor(
        private coreSchemas: CoreGraphQLSchemaFactory.Interface[],
        private userSchemas: GraphQLSchemaFactory.Interface[]
    ) {}

    async build(): Promise<IGraphQLSchema> {
        const builder = new GraphQLSchemaBuilder();

        for (const factory of this.coreSchemas) {
            await factory.execute(builder);
        }

        for (const factory of this.userSchemas) {
            await factory.execute(builder);
        }

        return builder.build();
    }
}

export const GraphQLSchemaComposer = Abstraction.createImplementation({
    implementation: GraphQLSchemaComposerImpl,
    dependencies: [
        [CoreGraphQLSchemaFactory, { multiple: true }],
        [GraphQLSchemaFactory, { multiple: true }]
    ]
});
