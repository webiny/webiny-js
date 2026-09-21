import type { Container } from "@webiny/feature/api";
import { CoreGraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { GraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { addPageCompositionSchema } from "./schema.js";

class PageCompositionSchemaFactoryImpl implements CoreGraphQLSchemaFactory.Interface {
    public async execute(builder: GraphQLSchemaBuilder.Interface): CoreGraphQLSchemaFactory.Return {
        addPageCompositionSchema(builder);
        return builder;
    }
}

const PageCompositionSchemaFactory = CoreGraphQLSchemaFactory.createImplementation({
    implementation: PageCompositionSchemaFactoryImpl,
    dependencies: []
});

export const registerPageCompositionGraphQL = (container: Container): void => {
    container.register(PageCompositionSchemaFactory);
};
