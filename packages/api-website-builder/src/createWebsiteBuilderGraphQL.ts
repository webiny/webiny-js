import { ContextPlugin } from "@webiny/api";
import { isHeadlessCmsReady } from "@webiny/api-headless-cms";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import type { WebsiteBuilderContext } from "~/types";
import type { CmsModel } from "@webiny/api-headless-cms/types";
import { createFieldTypePluginRecords } from "@webiny/api-headless-cms/graphql/schema/createFieldTypePluginRecords";
import { createGraphQLSchemaPluginFromFieldPlugins } from "@webiny/api-headless-cms/utils/getSchemaFromFieldPlugins";
import { PAGE_MODEL_ID } from "~/page/page.model";
import { createPagesSchema } from "~/page/page.gql";

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

        enum WbSortDirection {
            ASC
            DESC
        }

        input WbSort {
            id: WbSortDirection
            createdOn: WbSortDirection
            modifiedOn: WbSortDirection
            savedOn: WbSortDirection
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

export const createWebsiteBuilderGraphQL = () => {
    const pageSchema = new ContextPlugin<WebsiteBuilderContext>(async context => {
        if (!(await isHeadlessCmsReady(context))) {
            return;
        }

        await context.security.withoutAuthorization(async () => {
            const model = (await context.cms.getModel(PAGE_MODEL_ID)) as CmsModel;
            const models = await context.cms.listModels();
            const fieldPlugins = createFieldTypePluginRecords(context.plugins);

            // We need to register all plugins for all the CMS fields.
            const plugins = createGraphQLSchemaPluginFromFieldPlugins({
                models,
                type: "manage",
                fieldTypePlugins: fieldPlugins,
                createPlugin: ({ schema, type, fieldType }) => {
                    const plugin = new GraphQLSchemaPlugin(schema);
                    plugin.name = `wb.graphql.page.schema.${type}.field.${fieldType}`;
                    return plugin;
                }
            });

            const graphQlPlugin = createPagesSchema({
                model,
                models,
                plugins: fieldPlugins
            });

            context.plugins.register([...plugins, graphQlPlugin]);
        });
    });

    return [baseSchema, pageSchema];
};
