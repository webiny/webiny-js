import { CmsContext } from "~/types";
import { CmsGraphQLSchemaPlugin } from "~/plugins";
import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";

export const createBaseSchema = (): GraphQLSchemaPlugin<CmsContext>[] => {
    const cmsPlugin = new CmsGraphQLSchemaPlugin({
        typeDefs: /* GraphQL */ `
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
                validate: Boolean
            }

            input CreateRevisionCmsEntryOptionsInput {
                validate: Boolean
            }

            input UpdateCmsEntryOptionsInput {
                validate: Boolean
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
