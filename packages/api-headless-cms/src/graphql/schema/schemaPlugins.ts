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
import type { CmsGraphQLCompat } from "../compat/types.js";
import { transformModelSchema } from "../compat/v5/index.js";

interface GenerateSchemaPluginsParams {
    context: CmsContext;
    models: CmsModel[];
    compat?: CmsGraphQLCompat;
}

export const generateSchemaPlugins = async (
    params: GenerateSchemaPluginsParams
): Promise<ICmsGraphQLSchemaPlugin[]> => {
    const { context, models, compat } = params;
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

    /**
     * When the endpoint serves an older schema shape, the generated v6 schema of each model is
     * rewritten into that shape. Everything else (base types, field type plugins) stays as is.
     */
    const createModelPlugin = (
        model: CmsModel,
        endpoint: ApiEndpoint,
        schema: { typeDefs: string; resolvers: any }
    ) => {
        if (compat === "v5") {
            const { typeDefs, resolvers, conflicts } = transformModelSchema({
                model,
                endpoint,
                ...schema
            });
            if (conflicts.length > 0) {
                console.warn(
                    `Model "${model.modelId}" has fields which are not available in the v5 schema, because their names are taken by entry fields: ${conflicts.join(", ")}.`
                );
            }
            return createCmsGraphQLSchemaPlugin({ typeDefs, resolvers });
        }
        return createCmsGraphQLSchemaPlugin(schema);
    };

    const schemaPlugins = createGraphQLSchemaPluginFromFieldPlugins({
        models,
        fieldRegistry,
        type
    });

    models.forEach(model => {
        if (model.tags?.includes(CMS_MODEL_SINGLETON_TAG)) {
            /**
             * We always need to send either manage or read.
             */
            const singularType: ApiEndpoint = type === "manage" ? "manage" : "read";
            const plugin = createModelPlugin(model, singularType, {
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
                    const plugin = createModelPlugin(model, type, {
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
                    const plugin = createModelPlugin(model, type, {
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
