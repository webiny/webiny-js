import gql from "graphql-tag";
import { GraphQLContext as APIContext } from "@webiny/api/types";
import {
    CmsModel,
    CmsModelFieldToGraphQLPlugin,
    CmsFieldTypePlugins
} from "@webiny/api-headless-cms/types";
import { createManageSDL } from "./createManageSDL";
import { createReadSDL } from "./createReadSDL";
// import { createManageResolvers } from "./createManageResolvers";
// import { createReadResolvers } from "./createReadResolvers";
import { renderTypesFromFieldPlugins } from "../utils/renderTypesFromFieldPlugins";

export interface GenerateSchemaPlugins {
    (params: { context: APIContext }): Promise<void>;
}

export const generateSchemaPlugins: GenerateSchemaPlugins = async ({ context }) => {
    const { plugins } = context;

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

    const newPlugins = [
        {
            name: "graphql-schema-cms-field-types",
            type: "graphql-schema",
            schema: {
                typeDefs: gql`
                    ${renderTypesFromFieldPlugins({ fieldTypePlugins, type: "manage" })}
                    ${renderTypesFromFieldPlugins({ fieldTypePlugins, type: "read" })}
                `,
                resolvers: {}
            }
        }
    ];

    models.forEach(model => {
        // Create a schema plugin for each model (Management API)
        newPlugins.push({
            name: "graphql-schema-" + model.modelId + "-manage",
            type: "graphql-schema",
            schema: {
                typeDefs: gql`
                    ${createManageSDL({ model, context, fieldTypePlugins })}
                `,
                resolvers: {} // createManageResolvers({ models, model, fieldTypePlugins, context })
            }
        });

        // Create a schema plugin for each model (Read API)
        newPlugins.push({
            name: "graphql-schema-" + model.modelId + "-read",
            type: "graphql-schema",
            schema: {
                typeDefs: gql`
                    ${createReadSDL({ model, context, fieldTypePlugins })}
                `,
                resolvers: {} // createReadResolvers({ models, model, fieldTypePlugins, context })
            }
        });
    });

    plugins.register(newPlugins);
};
