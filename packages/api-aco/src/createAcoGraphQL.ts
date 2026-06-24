import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { filterSchema } from "~/filter/filter.gql.js";
import { createFoldersSchema } from "~/folder/folder.gql.js";
import type { AcoContext } from "~/types.js";
import { ContextPlugin } from "@webiny/api";
import { isHeadlessCmsReady } from "@webiny/api-headless-cms";
import type { CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { createGraphQLSchemaPluginFromFieldPlugins } from "@webiny/api-headless-cms/utils/getSchemaFromFieldPlugins.js";
import { FOLDER_MODEL_ID } from "~/domain/folder/folder.model.js";
import { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";

const emptyResolver = () => ({});

const baseSchema = new GraphQLSchemaPlugin({
    typeDefs: /* GraphQL */ `
        type AcoQuery {
            _empty: String
        }

        type AcoMutation {
            _empty: String
        }

        type AcoMeta {
            hasMoreItems: Boolean
            totalCount: Int
            cursor: String
        }

        type AcoUser {
            id: ID
            displayName: String
            type: String
        }

        type AcoError {
            code: String
            message: String
            data: JSON
            stack: String
        }

        type AcoBooleanResponse {
            data: Boolean
            error: AcoError
        }

        enum AcoSortDirection {
            ASC
            DESC
        }

        input AcoSort {
            id: AcoSortDirection
            createdOn: AcoSortDirection
            modifiedOn: AcoSortDirection
            savedOn: AcoSortDirection
            title: AcoSortDirection
        }

        extend type Query {
            aco: AcoQuery
        }

        extend type Mutation {
            aco: AcoMutation
        }
    `,
    resolvers: {
        Query: {
            aco: emptyResolver
        },
        Mutation: {
            aco: emptyResolver
        }
    }
});

export const createAcoGraphQL = () => {
    const folderSchema = new ContextPlugin<AcoContext>(async context => {
        if (!(await isHeadlessCmsReady(context))) {
            return;
        }

        const fieldRegistry = context.container.resolve(CmsModelFieldToGraphQLRegistry);

        await context.container.resolve(IdentityContext).withoutAuthorization(async () => {
            const model = (await context.cms.getModel(FOLDER_MODEL_ID)) as CmsModel;
            const models = await context.cms.listModels();
            /**
             * We need to register all plugins for all the CMS fields.
             */
            const plugins = createGraphQLSchemaPluginFromFieldPlugins({
                models,
                type: "manage",
                fieldRegistry,
                createPlugin: ({ schema, type, fieldType }) => {
                    const plugin = new GraphQLSchemaPlugin(schema);
                    plugin.name = `aco.graphql.folder.schema.${type}.field.${fieldType}`;
                    return plugin;
                }
            });

            const graphQlPlugin = createFoldersSchema({
                model,
                models,
                fieldRegistry
            });

            context.plugins.register([...plugins, graphQlPlugin]);
        });
    });

    return [baseSchema, folderSchema, filterSchema];
};
