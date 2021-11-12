import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/plugins/GraphQLSchemaPlugin";
import { CmsModelFieldToGraphQLPlugin, CmsFieldTypePlugins, CmsContext } from "~/types";
import { createManageSDL } from "./createManageSDL";
import { createReadSDL } from "./createReadSDL";
import { createManageResolvers } from "./createManageResolvers";
import { createReadResolvers } from "./createReadResolvers";
import { createPreviewResolvers } from "./createPreviewResolvers";
import { getSchemaFromFieldPlugins } from "~/content/plugins/utils/getSchemaFromFieldPlugins";

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
    context.security.disableAuthorization();
    const models = await cms.listModels();
    context.security.enableAuthorization();

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
