import type { HcmsBulkActionsContext } from "~/types.js";
import { CmsGraphQLSchemaPlugin, isHeadlessCmsReady } from "@webiny/api-headless-cms";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels/index.js";
import { CMS_MODEL_SINGLETON_TAG } from "@webiny/api-headless-cms/constants.js";
import { ContextPlugin } from "@webiny/api";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";

export const createDefaultGraphQL = () => {
    return new ContextPlugin<HcmsBulkActionsContext>(async context => {
        const tenant = context.container.resolve(TenantContext).getTenant();

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

        const modelsResult = await context.container
            .resolve(IdentityContext)
            .withoutAuthorization(async () => {
                return context.container.resolve(ListModelsUseCase).execute();
            });
        if (modelsResult.isFail()) {
            return;
        }
        const models = modelsResult.value.filter(model => {
            if (model.isPrivate) {
                return false;
            }
            const tags = Array.isArray(model.tags) ? model.tags : [];
            return !tags.includes(CMS_MODEL_SINGLETON_TAG);
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
                isApplicable: context =>
                    context.container.resolve(TenantContext).getTenant().id === tenant.id
            });

            plugin.name = `headless-cms.graphql.schema.bulkAction.default.${model.modelId}`;
            modelPlugins.push(plugin);
        });

        context.plugins.register([defaultPlugin, ...modelPlugins]);
    });
};
