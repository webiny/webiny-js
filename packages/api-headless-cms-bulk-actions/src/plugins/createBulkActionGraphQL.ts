import { ContextPlugin } from "@webiny/api";
import type { HcmsBulkActionsContext } from "~/types.js";
import { CmsGraphQLSchemaPlugin, isHeadlessCmsReady } from "@webiny/api-headless-cms";
import { Response } from "@webiny/handler-graphql";
import { CMS_MODEL_SINGLETON_TAG } from "@webiny/api-headless-cms/constants.js";

export interface CreateBulkActionGraphQL {
    name: string;
    modelIds?: string[];
}

export const createBulkActionGraphQL = (config: CreateBulkActionGraphQL) => {
    return new ContextPlugin<HcmsBulkActionsContext>(async ctx => {
        const tenant = ctx.tenancy.getCurrentTenant();

        if (!(await isHeadlessCmsReady(ctx))) {
            return;
        }

        const models = await ctx.security.withoutAuthorization(async () => {
            const allModels = await ctx.cms.listModels();
            return allModels.filter(model => {
                if (model.isPrivate) {
                    return false;
                }
                const tags = Array.isArray(model.tags) ? model.tags : [];
                if (tags.includes(CMS_MODEL_SINGLETON_TAG)) {
                    return false;
                }
                if (config.modelIds?.length) {
                    return config.modelIds.includes(model.modelId);
                }
                return true;
            });
        });

        const plugins: CmsGraphQLSchemaPlugin<HcmsBulkActionsContext>[] = [];

        models.forEach(model => {
            const plugin = new CmsGraphQLSchemaPlugin<HcmsBulkActionsContext>({
                typeDefs: /* GraphQL */ `
                     extend enum BulkAction${model.singularApiName}Name {
                        ${config.name}
                    }
                `,
                resolvers: {
                    Mutation: {
                        [`bulkAction${model.singularApiName}`]: async (_, args, context) => {
                            const identity = context.security.getIdentity();

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
                                id: response.id
                            });
                        }
                    }
                },
                isApplicable: context => context.tenancy.getCurrentTenant().id === tenant.id
            });

            plugin.name = `headless-cms.graphql.schema.bulkAction.${model.modelId}.${config.name}`;
            plugins.push(plugin);
        });

        ctx.plugins.register([...plugins]);
    });
};
