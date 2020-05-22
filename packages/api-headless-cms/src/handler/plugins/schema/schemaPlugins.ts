import gql from "graphql-tag";
import { GraphQLSchemaPlugin } from "@webiny/graphql/types";
import {
    CmsContentModel,
    CmsModelFieldToGraphQLPlugin,
    CmsFieldTypePlugins,
    CmsContext
} from "@webiny/api-headless-cms/types";
import { createManageSDL } from "./createManageSDL";
import { createReadSDL } from "./createReadSDL";
import { createManageResolvers } from "./createManageResolvers";
import { createReadResolvers } from "./createReadResolvers";
import { getSchemaFromFieldPlugins } from "../utils/getSchemaFromFieldPlugins";

export interface GenerateSchemaPlugins {
    (params: { context: CmsContext }): Promise<void>;
}

export const generateSchemaPlugins: GenerateSchemaPlugins = async ({ context }) => {
    const { plugins, cms } = context;

    // Structure plugins for faster access
    const fieldTypePlugins: CmsFieldTypePlugins = plugins
        .byType<CmsModelFieldToGraphQLPlugin>("cms-model-field-to-graphql")
        .reduce((acc, pl) => {
            acc[pl.fieldType] = pl;
            return acc;
        }, {});

    // Load model data
    const { CmsContentModel } = context.models;

    const models: CmsContentModel[] = await CmsContentModel.find();

    const schemas = getSchemaFromFieldPlugins({ fieldTypePlugins, type: cms.type });

    const newPlugins: GraphQLSchemaPlugin[] = schemas.map((s, i) => ({
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
                            typeDefs: gql`
                                ${createManageSDL({ model, context, fieldTypePlugins })}
                            `,
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
                            typeDefs: gql`
                                ${createReadSDL({ model, context, fieldTypePlugins })}
                            `,
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

    plugins.register(newPlugins);
};
