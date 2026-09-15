import type { Container } from "@webiny/di";
import { CoreGraphQLSchemaFactory } from "@webiny/api-graphql/graphql/abstractions.js";
import { GraphQLSchemaBuilder } from "@webiny/api-graphql/features/GraphQLSchemaBuilder/abstractions.js";
import { addPagesSchema } from "~/graphql/pages/pages.gql.js";
import { addRedirectsSchema } from "./redirects/redirects.gql.js";
import { addExperimentsSchema } from "./experiments/experiments.gql.js";

const BASE_TYPE_DEFS = /* GraphQL */ `
    type WbQuery {
        _empty: String
    }

    type WbMutation {
        _empty: String
    }

    type WbMeta {
        hasMoreItems: Boolean
        totalCount: Int
        cursor: String
    }

    type WbIdentity {
        id: ID
        displayName: String
        type: String
    }

    input WbIdentityInput {
        id: String!
        displayName: String!
        type: String!
    }

    type WbLocation {
        folderId: String
    }

    input WbLocationInput {
        folderId: String
    }

    input WbLocationWhereInput {
        folderId: ID
        folderId_in: [ID!]
        folderId_not: ID
        folderId_not_in: [ID!]
    }

    type WbError {
        code: String
        message: String
        data: JSON
        stack: String
    }

    type WbBooleanResponse {
        data: Boolean
        error: WbError
    }

    # CMS base content types referenced by the page/redirect schemas. WB pages and redirects are
    # CMS entries exposed via this custom schema, which runs on the main GraphQL engine rather than
    # the CMS endpoint — so these shared base types (normally provided by the CMS base schema) must
    # be declared here. Kept in sync with @webiny/api-headless-cms baseSchema.ts.
    type CmsEntrySystem {
        _empty: String
    }

    type CmsEntryLive {
        version: Int!
    }

    input CmsEntryLiveWhereInput {
        version: Int
        version_gt: Int
        version_gte: Int
        version_lt: Int
        version_lte: Int
        version_not: Int
        version_in: [Int!]
        version_not_in: [Int!]
    }

    input ListWhereInputCmsEntrySystem {
        _empty: String
    }

    extend type Query {
        websiteBuilder: WbQuery
    }

    extend type Mutation {
        websiteBuilder: WbMutation
    }
`;

const addBaseSchema = (builder: GraphQLSchemaBuilder.Interface): void => {
    builder.addTypeDefs(BASE_TYPE_DEFS);
    builder.addResolver({
        path: "Query.websiteBuilder",
        dependencies: [],
        resolver: () => () => ({})
    });
    builder.addResolver({
        path: "Mutation.websiteBuilder",
        dependencies: [],
        resolver: () => () => ({})
    });
};

class WebsiteBuilderSchemaFactoryImpl implements CoreGraphQLSchemaFactory.Interface {
    public async execute(builder: GraphQLSchemaBuilder.Interface): CoreGraphQLSchemaFactory.Return {
        addBaseSchema(builder);
        addPagesSchema(builder);
        addRedirectsSchema(builder);
        addExperimentsSchema(builder);
        return builder;
    }
}

const WebsiteBuilderSchemaFactory = CoreGraphQLSchemaFactory.createImplementation({
    implementation: WebsiteBuilderSchemaFactoryImpl,
    dependencies: []
});

/**
 * Registers the WB GraphQL schema (base + pages + redirects) as a DI-native CoreGraphQLSchemaFactory
 * contributor. The schema is static (no per-request/model data), so it registers at feature-register
 * time — before the engine's GraphQLSchemaComposer builds. Each resolver declares its use-case
 * dependencies via builder.addResolver rather than service-locating them from the request context.
 */
export const registerWebsiteBuilderGraphQL = (container: Container) => {
    container.register(WebsiteBuilderSchemaFactory);
};
