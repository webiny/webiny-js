import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import {
    CmsModelFieldToGraphQLPlugin,
    CmsFieldTypePlugins,
    CmsContext,
    CmsContentModel
} from "../../../types";
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
        .map<CmsContentModel>(plugin => plugin.contentModel);

    const models = [...databaseModels, ...pluginsModels];

    const schemas = getSchemaFromFieldPlugins({ models, fieldTypePlugins, type: cms.type });

    const newPlugins: GraphQLSchemaPlugin<CmsContext>[] = schemas.map((s, i) => ({
        name: "graphql-schema-cms-field-types-" + i,
        type: "graphql-schema",
        schema: {
            typeDefs: s.typeDefs,
            resolvers: s.resolvers || {}
        }
    }));

    models
        .filter(model => model.fields.length > 0)
        .forEach(model => {
            switch (cms.type) {
                case "manage":
                    newPlugins.push({
                        name: "graphql-schema-" + model.modelId + "-manage",
                        type: "graphql-schema",
                        schema: {
                            typeDefs: createManageSDL({ model, fieldTypePlugins }),
                            resolvers: createManageResolvers({
                                models,
                                model,
                                fieldTypePlugins,
                                context
                            })
                        }
                    });

                    break;
                case "preview":
                case "read":
                    newPlugins.push({
                        name: "graphql-schema-" + model.modelId + "-read",
                        type: "graphql-schema",
                        schema: {
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
                        }
                    });
                    break;
                default:
                    return;
            }
        });

    return newPlugins;
};
