import type { Container } from "@webiny/di";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { createPagesSchema } from "~/graphql/pages/pages.gql.js";
import { createRedirectsSchema } from "./redirects/redirects.gql.js";

const emptyResolver = () => ({});

const baseSchema = new GraphQLSchemaPlugin({
    typeDefs: /* GraphQL */ `
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
    `,
    resolvers: {
        Query: {
            websiteBuilder: emptyResolver
        },
        Mutation: {
            websiteBuilder: emptyResolver
        }
    }
});

/**
 * Registers the WB GraphQL schema (base + pages + redirects) as CoreGraphQLSchemaFactory instances.
 * The DI engine's GraphQLSchemaComposer builds from CoreGraphQLSchemaFactory registrations (it does
 * NOT read ctx.plugins), so each legacy WB GraphQLSchemaPlugin is bridged here. The schema is static
 * (no per-request/model data), so this runs at feature-register time — before the composer builds.
 */
export const registerWebsiteBuilderGraphQL = (container: Container) => {
    const schemaPlugins = [baseSchema, createPagesSchema(), createRedirectsSchema()];
    for (const schemaPlugin of schemaPlugins) {
        container.registerInstance(CoreGraphQLSchemaFactory, {
            async execute(builder: CoreGraphQLSchemaFactory.SchemaBuilder) {
                const { schema } = schemaPlugin;
                if (schema.typeDefs) {
                    builder.addTypeDefs(schema.typeDefs as string);
                }
                if (schema.resolvers) {
                    builder.addLegacyResolvers(schema.resolvers as Record<string, any>);
                }
                if (schema.resolverDecorators) {
                    for (const [path, decorators] of Object.entries(schema.resolverDecorators)) {
                        for (const decorator of decorators as any[]) {
                            builder.addResolverDecorator(path, decorator);
                        }
                    }
                }
                return builder;
            }
        });
    }
};
