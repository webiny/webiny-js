import type { CmsContext } from "~/types/index.js";
import { createCmsGraphQLSchemaPlugin } from "~/plugins/index.js";
import type { IGraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { ContextPlugin } from "@webiny/api";

const createSchema = (): IGraphQLSchemaPlugin<CmsContext>[] => {
    const cmsPlugin = createCmsGraphQLSchemaPlugin({
        typeDefs: /* GraphQL */ `
            type CmsIdentity {
                id: String
                displayName: String
                type: String
            }

            type CmsError {
                code: String
                message: String
                data: JSON
                stack: String
            }

            type CmsCursors {
                next: String
                previous: String
            }

            type CmsListMeta {
                cursor: String
                hasMoreItems: Boolean
                totalCount: Int
            }

            input CmsDeleteEntryOptions {
                # force delete an entry that might have some records left behind in the database
                # see CmsDeleteEntryOptions in types.ts
                force: Boolean
                # permanently delete an entry without moving it to the bin
                permanently: Boolean
            }

            type CmsDeleteResponse {
                data: Boolean
                error: CmsError
            }

            type CmsDeleteMultipleDataResponse {
                id: ID!
            }

            type CmsDeleteMultipleResponse {
                data: [CmsDeleteMultipleDataResponse!]
                error: CmsError
            }

            type CmsBooleanResponse {
                data: Boolean
                error: CmsError
            }

            # Advanced Content Organization
            type WbyAcoLocation {
                folderId: ID
            }

            input WbyAcoLocationInput {
                folderId: ID!
            }

            input WbyAcoLocationWhereInput {
                folderId: ID
                folderId_in: [ID!]
                folderId_not: ID
                folderId_not_in: [ID!]
            }

            input CreateCmsEntryOptionsInput {
                skipValidation: Boolean
            }

            input CreateRevisionCmsEntryOptionsInput {
                skipValidation: Boolean
            }

            input UpdateCmsEntryOptionsInput {
                skipValidation: Boolean
            }

            input CmsIdentityInput {
                id: String!
                displayName: String!
                type: String!
            }

            type CmsEntryValidationResponseData {
                error: String!
                id: String!
                fieldId: String!
                parents: [String!]!
            }

            type CmsEntryValidationResponse {
                data: [CmsEntryValidationResponseData!]
                error: CmsError
            }

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
        `,
        resolvers: {}
    });
    cmsPlugin.name = "headless-cms.graphql.schema.base";
    const corePlugin = new GraphQLSchemaPlugin<CmsContext>({
        typeDefs: cmsPlugin.schema.typeDefs,
        resolvers: cmsPlugin.schema.resolvers
    });
    corePlugin.name = "headless-cms.graphql.core.schema.base";
    /**
     * Due to splitting of CMS and Core schema plugins, we must have both defined for CMS to work.
     */
    return [cmsPlugin, corePlugin];
};

export const createBaseSchema = () => {
    const plugin = new ContextPlugin<CmsContext>(async context => {
        context.plugins.register(...createSchema());
    });

    plugin.name = "headless-cms.graphql.createBaseSchema";

    return plugin;
};
