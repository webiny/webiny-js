import { GraphQLSchemaPlugin } from "@webiny/handler-graphql";
import { CmsContext } from "~/types";

export const createBaseSchema = (): GraphQLSchemaPlugin<CmsContext> => {
    const plugin = new GraphQLSchemaPlugin({
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
    plugin.name = "cms.graphql.schema.base";
    return plugin;
};
