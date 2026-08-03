import type { Container } from "@webiny/di";
import { CoreGraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { GraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { addExtractionSchema } from "./extraction.gql.js";

/**
 * Extraction contributes a second schema factory rather than editing the theme one.
 *
 * `ThemeQuery`, `ThemeMutation` and `ThemeError` come from `@webiny/api-theme`; this only extends them.
 * Both factories register at feature-register time and the composer merges them, so extraction stays a
 * separate package while presenting as part of the theme API.
 */
class ThemeExtractionSchemaFactoryImpl implements CoreGraphQLSchemaFactory.Interface {
    public async execute(builder: GraphQLSchemaBuilder.Interface): CoreGraphQLSchemaFactory.Return {
        addExtractionSchema(builder);
        return builder;
    }
}

const ThemeExtractionSchemaFactory = CoreGraphQLSchemaFactory.createImplementation({
    implementation: ThemeExtractionSchemaFactoryImpl,
    dependencies: []
});

export const registerThemeExtractionGraphQL = (container: Container) => {
    container.register(ThemeExtractionSchemaFactory);
};
