import { ContextPlugin } from "@webiny/api";
import { HcmsBulkActionsContext } from "~/types";
import { CmsGraphQLSchemaPlugin, isHeadlessCmsReady } from "@webiny/api-headless-cms";

export const createDefaultGraphQL = () => {
    return new ContextPlugin<HcmsBulkActionsContext>(async context => {
        if (!(await isHeadlessCmsReady(context))) {
            return;
        }

        const plugin = new CmsGraphQLSchemaPlugin({
            typeDefs: /* GraphQL */ `
                type BulkActionResponseData {
                    id: String
                }

                type BulkActionResponse {
                    data: BulkActionResponseData
                    error: CmsError
                }
            `
        });

        plugin.name = `headless-cms.graphql.schema.bulkAction`;
        context.plugins.register([plugin]);
    });
};
