import { CmsModelFieldToGraphQLPlugin, CmsFieldTypePlugins, CmsContext, CmsModel } from "~/types";
import { createManageSDL } from "./createManageSDL";
import { createReadSDL } from "./createReadSDL";
import { createManageResolvers } from "./createManageResolvers";
import { createReadResolvers } from "./createReadResolvers";
import { createPreviewResolvers } from "./createPreviewResolvers";
import { createGraphQLSchemaPluginFromFieldPlugins } from "~/utils/getSchemaFromFieldPlugins";
import { CmsGraphQLSchemaSorterPlugin } from "~/plugins";
import { CmsGraphQLSchemaPlugin } from "~/plugins";

interface GenerateSchemaPluginsParams {
    context: CmsContext;
    models: CmsModel[];
}
export const generateSchemaPlugins = async (
    params: GenerateSchemaPluginsParams
): Promise<CmsGraphQLSchemaPlugin[]> => {
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
    const fieldTypePlugins = plugins
        .byType<CmsModelFieldToGraphQLPlugin>("cms-model-field-to-graphql")
        .reduce<CmsFieldTypePlugins>((acc, pl) => {
            acc[pl.fieldType] = pl;
            return acc;
        }, {});

    const sorterPlugins = plugins.byType<CmsGraphQLSchemaSorterPlugin>(
        CmsGraphQLSchemaSorterPlugin.type
    );

    // const schemas = getSchemaFromFieldPlugins({
    //     models,
    //     fieldTypePlugins,
    //     type
    // });

    // const newPlugins: CmsGraphQLSchemaPlugin[] = [];
    // for (const schema of schemas) {
    //     newPlugins.push(new CmsGraphQLSchemaPlugin(schema));
    // }
    const schemaPlugins = createGraphQLSchemaPluginFromFieldPlugins({
        models,
        fieldTypePlugins,
        type
    });

    models
        .filter(model => model.fields.length > 0)
        .forEach(model => {
            switch (type) {
                case "manage":
                    {
                        const plugin = new CmsGraphQLSchemaPlugin({
                            typeDefs: createManageSDL({ model, fieldTypePlugins, sorterPlugins }),
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
                        const plugin = new CmsGraphQLSchemaPlugin({
                            typeDefs: createReadSDL({ model, fieldTypePlugins, sorterPlugins }),
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
