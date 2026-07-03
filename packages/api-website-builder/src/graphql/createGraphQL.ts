import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { CoreGraphQLSchemaFactory } from "@webiny/handler-graphql/graphql/abstractions.js";
import { createContextPlugin } from "@webiny/api";
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

export const createGraphQL = () => {
    // The WB schema is authored as legacy GraphQLSchemaPlugins, but the DI engine's
    // GraphQLSchemaComposer builds the schema from CoreGraphQLSchemaFactory registrations — it does
    // NOT read ctx.plugins. registerLegacyPluginsViaGqlContextualSchema only routes plain schema
    // plugins into ctx.plugins, so without this bridge they never reach the schema (manifesting as
    // "Unknown type: WbError" or a missing `websiteBuilder` query field). Register each WB schema
    // plugin as a CoreGraphQLSchemaFactory at request time via a ContextPlugin (apply runs in the
    // initializer phase, before the composer builds).
    const plugin = createContextPlugin(async (ctx: Record<string, any>) => {
        const schemaPlugins = [baseSchema, createPagesSchema(), createRedirectsSchema()];
        for (const schemaPlugin of schemaPlugins) {
            ctx.container.registerInstance(CoreGraphQLSchemaFactory, {
                async execute(builder: CoreGraphQLSchemaFactory.SchemaBuilder) {
                    const { schema } = schemaPlugin;
                    if (schema.typeDefs) {
                        builder.addTypeDefs(schema.typeDefs as string);
                    }
                    if (schema.resolvers) {
                        builder.addLegacyResolvers(schema.resolvers as Record<string, any>);
                    }
                    if (schema.resolverDecorators) {
                        for (const [path, decorators] of Object.entries(
                            schema.resolverDecorators
                        )) {
                            for (const decorator of decorators as any[]) {
                                builder.addResolverDecorator(path, decorator);
                            }
                        }
                    }
                    return builder;
                }
            });
        }
    });
    plugin.name = "websiteBuilder.graphql";
    return [plugin];
};
