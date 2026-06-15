import type { HcmsBulkActionsContext } from "~/types.js";
import { CmsGraphQLSchemaPlugin, isHeadlessCmsReady } from "@webiny/api-headless-cms";
import { CMS_MODEL_SINGLETON_TAG } from "@webiny/api-headless-cms/constants.js";
import { ContextPlugin } from "@webiny/api";

export const createDefaultGraphQL = () => {
    return new ContextPlugin<HcmsBulkActionsContext>(async context => {
        const tenant = context.tenancy.getCurrentTenant();

        if (!(await isHeadlessCmsReady(context))) {
            return;
        }

        const defaultPlugin = new CmsGraphQLSchemaPlugin({
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
        defaultPlugin.name = `headless-cms.graphql.schema.bulkAction.default`;

        const models = await context.security.withoutAuthorization(async () => {
            const allModels = await context.cms.listModels();
            return allModels.filter(model => {
                if (model.isPrivate) {
                    return false;
                }
                const tags = Array.isArray(model.tags) ? model.tags : [];
                if (tags.includes(CMS_MODEL_SINGLETON_TAG)) {
                    return false;
                }
                return true;
            });
        });

        const modelPlugins: CmsGraphQLSchemaPlugin<HcmsBulkActionsContext>[] = [];

        models.forEach(model => {
            const plugin = new CmsGraphQLSchemaPlugin({
                typeDefs: /* GraphQL */ `
                    enum BulkAction${model.singularApiName}Name {
                        _empty
                    }
                    
                    extend type Mutation {
                        bulkAction${model.singularApiName}(
                            action: BulkAction${model.singularApiName}Name!
                            where: ${model.singularApiName}ListWhereInput
                            search: String
                            data: JSON
                        ): BulkActionResponse
                    }
                `,
                isApplicable: context => context.tenancy.getCurrentTenant().id === tenant.id
            });

            plugin.name = `headless-cms.graphql.schema.bulkAction.default.${model.modelId}`;
            modelPlugins.push(plugin);
        });

        context.plugins.register([defaultPlugin, ...modelPlugins]);
    });
};
