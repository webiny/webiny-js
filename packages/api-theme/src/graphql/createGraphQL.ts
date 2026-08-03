import type { Container } from "@webiny/di";
import { CoreGraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { GraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { addThemeSchema } from "./theme.gql.js";

const BASE_TYPE_DEFS = /* GraphQL */ `
    type ThemeQuery {
        _empty: String
    }

    type ThemeMutation {
        _empty: String
    }

    type ThemeError {
        code: String
        message: String
        data: JSON
        stack: String
    }

    extend type Query {
        theme: ThemeQuery
    }

    extend type Mutation {
        theme: ThemeMutation
    }
`;

const addBaseSchema = (builder: GraphQLSchemaBuilder.Interface): void => {
    builder.addTypeDefs(BASE_TYPE_DEFS);
    builder.addResolver({
        path: "Query.theme",
        dependencies: [],
        resolver: () => () => ({})
    });
    builder.addResolver({
        path: "Mutation.theme",
        dependencies: [],
        resolver: () => () => ({})
    });
};

class ThemeSchemaFactoryImpl implements CoreGraphQLSchemaFactory.Interface {
    public async execute(builder: GraphQLSchemaBuilder.Interface): CoreGraphQLSchemaFactory.Return {
        addBaseSchema(builder);
        addThemeSchema(builder);
        return builder;
    }
}

const ThemeSchemaFactory = CoreGraphQLSchemaFactory.createImplementation({
    implementation: ThemeSchemaFactoryImpl,
    dependencies: []
});

/**
 * The Theme schema is static — no per-request or per-model data — so it registers at feature-register
 * time, before the engine's schema composer builds. Each resolver declares its use-case dependencies
 * through `builder.addResolver` rather than service-locating them from the request context.
 */
export const registerThemeGraphQL = (container: Container) => {
    container.register(ThemeSchemaFactory);
};
