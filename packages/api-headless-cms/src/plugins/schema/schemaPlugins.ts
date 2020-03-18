import gql from "graphql-tag";
import { GraphQLSchemaPlugin } from "@webiny/api/types";
import {
    CmsModel,
    CmsModelFieldToGraphQLPlugin,
    CmsFieldTypePlugins,
    CmsGraphQLContext
} from "@webiny/api-headless-cms/types";
import { createManageSDL } from "./createManageSDL";
import { createReadSDL } from "./createReadSDL";
import { createManageResolvers } from "./createManageResolvers";
import { createReadResolvers } from "./createReadResolvers";
import { getSchemaFromFieldPlugins } from "../utils/getSchemaFromFieldPlugins";

export interface GenerateSchemaPlugins {
    (params: { context: CmsGraphQLContext }): Promise<void>;
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

    const models: CmsModel[] = await CmsContentModel.find();

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
            if (cms.type === "read") {
                newPlugins.push({
                    name: "graphql-schema-" + model.modelId + "-read",
                    type: "graphql-schema",
                    schema: {
                        typeDefs: gql`
                            ${createReadSDL({ model, context, fieldTypePlugins })}
                        `,
                        resolvers: createReadResolvers({ models, model, fieldTypePlugins, context })
                    }
                });
            } else {
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
            }
        });

    plugins.register(newPlugins);
};
