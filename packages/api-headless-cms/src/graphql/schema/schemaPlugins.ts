import type { ApiEndpoint, CmsContext, CmsModel } from "~/types/index.js";
import { createManageSDL } from "./createManageSDL.js";
import { createReadSDL } from "./createReadSDL.js";
import { createManageResolvers } from "./createManageResolvers.js";
import { createReadResolvers } from "./createReadResolvers.js";
import { createPreviewResolvers } from "./createPreviewResolvers.js";
import { createGraphQLSchemaPluginFromFieldPlugins } from "~/utils/getSchemaFromFieldPlugins.js";
import type { ICmsGraphQLSchemaPlugin } from "~/plugins/index.js";
import { createCmsGraphQLSchemaPlugin } from "~/plugins/index.js";
import { CMS_MODEL_SINGLETON_TAG } from "~/constants.js";
import { createSingularSDL } from "./createSingularSDL.js";
import { createSingularResolvers } from "./createSingularResolvers.js";
import {
    CmsGraphQLSchemaSorter,
    CmsModelFieldToGraphQLRegistry
} from "~/features/graphql/index.js";

interface GenerateSchemaPluginsParams {
    context: CmsContext;
    models: CmsModel[];
}

export const generateSchemaPlugins = async (
    params: GenerateSchemaPluginsParams
): Promise<ICmsGraphQLSchemaPlugin[]> => {
    const { context, models } = params;
    const { cms } = context;

    /**
     * If type does not exist, we are not generating schema plugins for models.
     * It should not come to this point, but we check it anyways.
     */
    const { type } = cms;
    if (!type) {
        return [];
    }

    const fieldRegistry = context.container.resolve(CmsModelFieldToGraphQLRegistry);

    const sorters = context.container.resolveAll(CmsGraphQLSchemaSorter);

    const schemaPlugins = createGraphQLSchemaPluginFromFieldPlugins({
        models,
        fieldRegistry,
        type
    });

    // Each per-model schema plugin is gated by the endpoint type that
    // produced it. Webiny was designed for serverless (fresh
    // PluginsContainer per Lambda invocation), so it relied on plugins
    // not surviving across endpoint types. In a long-lived host they
    // do — both manage and read variants accumulate, and listing them
    // all into the same schema mixes the manage `getTest(...)` signature
    // with the read `getTest(where: TestGetWhereInput!)` one. The merged
    // signature has revision/entryId/status PLUS the required where,
    // and the Admin UI's manage queries fail because they don't pass
    // it. Filtering at build time via isApplicable keeps each endpoint's
    // schema purely its own.
    const isApplicableFor =
        (endpointType: ApiEndpoint) =>
        (ctx: CmsContext): boolean =>
            ctx.cms.type === endpointType;

    models.forEach(model => {
        if (model.tags?.includes(CMS_MODEL_SINGLETON_TAG)) {
            /**
             * We always need to send either manage or read.
             */
            const singularType: ApiEndpoint = type === "manage" ? "manage" : "read";
            const plugin = createCmsGraphQLSchemaPlugin({
                isApplicable: isApplicableFor(singularType),
                typeDefs: createSingularSDL({
                    models,
                    model,
                    fieldRegistry,
                    type: singularType
                }),
                resolvers: createSingularResolvers({
                    models,
                    model,
                    fieldRegistry,
                    type: singularType
                })
            });
            plugin.name = `headless-cms.graphql.schema.singular.${model.modelId}`;
            schemaPlugins.push(plugin);
            return;
        }
        switch (type) {
            case "manage":
                {
                    const plugin = createCmsGraphQLSchemaPlugin({
                        isApplicable: isApplicableFor("manage"),
                        typeDefs: createManageSDL({
                            models,
                            model,
                            fieldRegistry,
                            sorters
                        }),
                        resolvers: createManageResolvers({
                            models,
                            model,
                            fieldRegistry
                        })
                    });
                    plugin.name = `headless-cms.graphql.schema.manage.${model.modelId}`;
                    schemaPlugins.push(plugin);
                }

                break;
            case "preview":
            case "read":
                {
                    const plugin = createCmsGraphQLSchemaPlugin({
                        isApplicable: isApplicableFor(type),
                        typeDefs: createReadSDL({
                            models,
                            model,
                            fieldRegistry,
                            sorters
                        }),
                        resolvers: cms.READ
                            ? createReadResolvers({
                                  models,
                                  model,
                                  fieldRegistry
                              })
                            : createPreviewResolvers({
                                  models,
                                  model,
                                  fieldRegistry
                              })
                    });
                    plugin.name = `headless-cms.graphql.schema.${type}.${model.modelId}`;
                    schemaPlugins.push(plugin);
                }
                break;
            default:
                return;
        }
    });

    return schemaPlugins.filter(pl => !!pl.schema.typeDefs);
};
