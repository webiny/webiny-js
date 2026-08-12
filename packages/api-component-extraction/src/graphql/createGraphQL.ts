import type { Container } from "@webiny/feature/api";
import { CoreGraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { GraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { addComponentExtractionSchema } from "./schema.js";

class ComponentExtractionSchemaFactoryImpl implements CoreGraphQLSchemaFactory.Interface {
    public async execute(builder: GraphQLSchemaBuilder.Interface): CoreGraphQLSchemaFactory.Return {
        addComponentExtractionSchema(builder);
        return builder;
    }
}

const ComponentExtractionSchemaFactory = CoreGraphQLSchemaFactory.createImplementation({
    implementation: ComponentExtractionSchemaFactoryImpl,
    dependencies: []
});

export const registerComponentExtractionGraphQL = (container: Container) => {
    container.register(ComponentExtractionSchemaFactory);
};
