import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";
import { CmsModelFieldToGraphQLPlugin, CmsFieldTypePlugins, CmsContext, CmsContentModel } from "~/types";
import { createManageSDL } from "./createManageSDL";
import { createReadSDL } from "./createReadSDL";
import { createManageResolvers } from "./createManageResolvers";
import { createReadResolvers } from "./createReadResolvers";
import { createPreviewResolvers } from "./createPreviewResolvers";
import { getSchemaFromFieldPlugins } from "../utils/getSchemaFromFieldPlugins";
import { ContentModelPlugin } from "../ContentModelPlugin";

export const generateSchemaPlugins = async (
    context: CmsContext
): Promise<GraphQLSchemaPlugin<CmsContext>[]> => {
    const { plugins, cms } = context;

    // Structure plugins for faster access
    const fieldTypePlugins: CmsFieldTypePlugins = plugins
        .byType<CmsModelFieldToGraphQLPlugin>("cms-model-field-to-graphql")
        .reduce((acc, pl) => {
            acc[pl.fieldType] = pl;
            return acc;
        }, {});

    // Load model data
    const databaseModels = await cms.models.noAuth().list();
    const pluginsModels: CmsContentModel[] = context.plugins
        .byType<ContentModelPlugin>(ContentModelPlugin.type)
        .map<CmsContentModel>(plugin => {
            // While we're iterating, let's also check if a model with
            // the same modelId was already returned from the database.
            const contentModel = plugin.contentModel;
            if (databaseModels.find(item => item.modelId === contentModel.modelId)) {
                throw new Error(
                    `Cannot register the "${contentModel.modelId}" content model via a plugin. A content model with the same model ID already exists in the database.`
                );
            }
            return contentModel;
        });

    const models = [...databaseModels, ...pluginsModels];

    const schemas = getSchemaFromFieldPlugins({ models, fieldTypePlugins, type: cms.type });

    const newPlugins: GraphQLSchemaPlugin<CmsContext>[] = [];
    for (const schema of schemas) {
        newPlugins.push(new GraphQLSchemaPlugin(schema));
    }

    models
        .filter(model => model.fields.length > 0)
        .forEach(model => {
            switch (cms.type) {
                case "manage":
                    newPlugins.push(
                        new GraphQLSchemaPlugin({
                            typeDefs: createManageSDL({ model, fieldTypePlugins }),
                            resolvers: createManageResolvers({
                                models,
                                model,
                                fieldTypePlugins,
                                context
                            })
                        })
                    );

                    break;
                case "preview":
                case "read":
                    newPlugins.push(
                        new GraphQLSchemaPlugin({
                            typeDefs: createReadSDL({ model, fieldTypePlugins }),
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
                        })
                    );
                    break;
                default:
                    return;
            }
        });

    return newPlugins;
};
