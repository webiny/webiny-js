import { GraphQLSchemaPlugin } from "@webiny/handler-graphql/types";
import {
    CmsModelFieldToGraphQLPlugin,
    CmsFieldTypePlugins,
    CmsContext
} from "@webiny/api-headless-cms/types";
import { createManageSDL } from "./createManageSDL";
import { createReadSDL } from "./createReadSDL";
import { createManageResolvers } from "./createManageResolvers";
import { createReadResolvers } from "./createReadResolvers";
import { getSchemaFromFieldPlugins } from "../utils/getSchemaFromFieldPlugins";

export const generateSchemaPlugins = async (context: CmsContext): Promise<GraphQLSchemaPlugin<CmsContext>[]> => {
    const { plugins, cms } = context;

    // Structure plugins for faster access
    const fieldTypePlugins: CmsFieldTypePlugins = plugins
        .byType<CmsModelFieldToGraphQLPlugin>("cms-model-field-to-graphql")
        .reduce((acc, pl) => {
            acc[pl.fieldType] = pl;
            return acc;
        }, {});

    // Load model data

    const models = await cms.models.list();

    const schemas = getSchemaFromFieldPlugins({ fieldTypePlugins, type: cms.type });

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
                        name: "graphql-schema-" + model.code + "-manage",
                        type: "graphql-schema",
                        schema: {
                            typeDefs: createManageSDL({ model, context, fieldTypePlugins }),
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
                        name: "graphql-schema-" + model.code + "-read",
                        type: "graphql-schema",
                        schema: {
                            typeDefs: createReadSDL({ model, context, fieldTypePlugins }),
                            resolvers: createReadResolvers({
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
