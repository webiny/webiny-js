import { CmsContext, CmsModel } from "~/types";
import { createManageSDL } from "./createManageSDL";
import { createReadSDL } from "./createReadSDL";
import { createManageResolvers } from "./createManageResolvers";
import { createReadResolvers } from "./createReadResolvers";
import { createPreviewResolvers } from "./createPreviewResolvers";
import { createGraphQLSchemaPluginFromFieldPlugins } from "~/utils/getSchemaFromFieldPlugins";
import {
    CmsGraphQLSchemaSorterPlugin,
    createCmsGraphQLSchemaPlugin,
    ICmsGraphQLSchemaPlugin
} from "~/plugins";
import { createFieldTypePluginRecords } from "~/graphql/schema/createFieldTypePluginRecords";

interface GenerateSchemaPluginsParams {
    context: CmsContext;
    models: CmsModel[];
}

export const generateSchemaPlugins = async (
    params: GenerateSchemaPluginsParams
): Promise<ICmsGraphQLSchemaPlugin[]> => {
    const { context, models } = params;
    const { plugins, cms } = context;

    /**
     * If type does not exist, we are not generating schema plugins for models.
     * It should not come to this point, but we check it anyways.
     */
    const { type } = cms;
    if (!type) {
        return [];
    }

    // Structure plugins for faster access
    const fieldTypePlugins = createFieldTypePluginRecords(plugins);

    const sorterPlugins = plugins.byType<CmsGraphQLSchemaSorterPlugin>(
        CmsGraphQLSchemaSorterPlugin.type
    );

    const schemaPlugins = createGraphQLSchemaPluginFromFieldPlugins({
        models,
        fieldTypePlugins,
        type
    });

    models
        .filter(model => {
            return model.fields.length > 0;
        })
        .forEach(model => {
            switch (type) {
                case "manage":
                    {
                        const plugin = createCmsGraphQLSchemaPlugin({
                            typeDefs: createManageSDL({
                                models,
                                model,
                                fieldTypePlugins,
                                sorterPlugins
                            }),
                            resolvers: createManageResolvers({
                                models,
                                model,
                                fieldTypePlugins,
                                context
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
                            typeDefs: createReadSDL({
                                models,
                                model,
                                fieldTypePlugins,
                                sorterPlugins
                            }),
                            resolvers: cms.READ
                                ? createReadResolvers({
                                      models,
                                      model,
                                      fieldTypePlugins,
                                      context
                                  })
                                : createPreviewResolvers({
                                      models,
                                      model,
                                      fieldTypePlugins,
                                      context
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
