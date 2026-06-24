import type { HcmsBulkActionsContext } from "~/types.js";
import { CmsGraphQLSchemaPlugin, isHeadlessCmsReady } from "@webiny/api-headless-cms";
import { Response } from "@webiny/handler-graphql";
import { CMS_MODEL_SINGLETON_TAG } from "@webiny/api-headless-cms/constants.js";
import { EntriesBulkAction } from "~/features/EntriesBulkAction/abstractions.js";
import { BulkActionName } from "~/domain/BulkActionName.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/abstractions.js";

export const createBulkActionGraphQL = async (
    context: HcmsBulkActionsContext,
    bulkAction: EntriesBulkAction.Interface
) => {
    const tenant = context.container.resolve(TenantContext).getTenant();

    // TODO: once we have GraphSchema plugin via an abstraction, we'll be able to remove this.
    if (!(await isHeadlessCmsReady(context))) {
        return;
    }

    const models = await context.container
        .resolve(IdentityContext)
        .withoutAuthorization(async () => {
            const allModels = await context.cms.listModels();
            return allModels.filter(model => {
                if (model.isPrivate) {
                    return false;
                }
                const tags = Array.isArray(model.tags) ? model.tags : [];
                if (tags.includes(CMS_MODEL_SINGLETON_TAG)) {
                    return false;
                }
                if (bulkAction.modelIds?.length) {
                    return bulkAction.modelIds.includes(model.modelId);
                }
                return true;
            });
        });

    const plugins: CmsGraphQLSchemaPlugin<HcmsBulkActionsContext>[] = [];

    models.forEach(model => {
        const plugin = new CmsGraphQLSchemaPlugin<HcmsBulkActionsContext>({
            typeDefs: /* GraphQL */ `
                     extend enum BulkAction${model.singularApiName}Name {
                        ${BulkActionName.from(bulkAction.name)}
                    }
                `,
            resolvers: {
                Mutation: {
                    [`bulkAction${model.singularApiName}`]: async (_, args, context) => {
                        const identity = context.container.resolve(IdentityContext).getIdentity();

                        const response = await context.tasks.trigger({
                            definition: `hcmsBulkList${args.action}Entries`,
                            input: {
                                modelId: model.modelId,
                                where: args.where,
                                search: args.search,
                                data: args.data,
                                identity
                            }
                        });

                        return new Response({
                            id: response.value.id
                        });
                    }
                }
            },
            isApplicable: context =>
                context.container.resolve(TenantContext).getTenant().id === tenant.id
        });

        plugin.name = `headless-cms.graphql.schema.bulkAction.${model.modelId}.${bulkAction.name}`;
        plugins.push(plugin);
    });

    context.plugins.register([...plugins]);
};
