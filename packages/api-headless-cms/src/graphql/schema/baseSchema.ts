import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { CmsContext } from "~/types";

export const createBaseSchema = (): GraphQLSchemaPlugin<CmsContext>[] => {
    const cmsPlugin = new GraphQLSchemaPlugin({
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

            type CmsDeleteResponse {
                data: Boolean
                error: CmsError
            }

            type CmsBooleanResponse {
                data: Boolean
                error: CmsError
            }
        `,
        resolvers: {}
    });
    cmsPlugin.name = "graphql.cms.schema.base";
    const corePlugin = new GraphQLSchemaPlugin({
        typeDefs: cmsPlugin.schema.typeDefs,
        resolvers: cmsPlugin.schema.resolvers
    });
    corePlugin.name = "graphql.cms.core.schema.base";
    /**
     * Due to splitting of CMS and Core schema plugins, we must have both defined for CMS to work.
     */
    return [cmsPlugin, corePlugin];
};
