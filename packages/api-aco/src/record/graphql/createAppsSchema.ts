import { CmsFieldTypePlugins, CmsModel } from "@webiny/api-headless-cms/types";
import { renderFields } from "@webiny/api-headless-cms/utils/renderFields";
import { renderInputFields } from "@webiny/api-headless-cms/utils/renderInputFields";
import { IAcoApp } from "~/types";

interface AppParams {
    app: IAcoApp;
    models: CmsModel[];
    plugins: CmsFieldTypePlugins;
}

const createAppSchema = (params: AppParams): string => {
    const { app, models, plugins: fieldTypePlugins } = params;
    const { model } = app;
    const { singularApiName: apiName, fields } = model;

    const fieldTypes = renderFields({
        models,
        model,
        fields,
        type: "manage",
        fieldTypePlugins
    });
    const inputFields = renderInputFields({
        models,
        model,
        fields,
        fieldTypePlugins
    });

    return /* GraphQL */ `
        ${fieldTypes.map(f => f.typeDefs).join("\n")}


        type ${apiName} {
            id: ID!
            entryId: ID!
            savedOn: DateTime
            createdOn: DateTime
            createdBy: AcoUser
            ${fieldTypes.map(f => f.fields).join("\n")}
        }

        ${inputFields.map(f => f.typeDefs).join("\n")}

        input ${apiName}Input {
            id: ID
            ${inputFields.map(f => f.fields).join("\n")}
        }

        input ${apiName}ListWhereInput {
            type: String!
            location: AcoSearchLocationInput
            tags_in: [String!]
            tags_startsWith: String
            tags_not_startsWith: String
        }

        type ${apiName}Response {
            data: ${apiName}
            error: AcoError
        }

        type ${apiName}ListResponse {
            data: [${apiName}!]
            error: AcoError
            meta: AcoMeta
        }

        extend type SearchQuery {
            get${apiName}(id: ID!): ${apiName}Response!
            list${apiName}(
                where: ${apiName}ListWhereInput
                search: String
                limit: Int
                after: String
                sort: AcoSort
            ): ${apiName}ListResponse!
        }

        extend type SearchMutation {
            create${apiName}(data: ${apiName}Input!): ${apiName}Response!
            update${apiName}(id: ID!, data: ${apiName}Input!): ${apiName}Response!
            delete${apiName}(id: ID!): AcoBooleanResponse!
        }
    `;
};

interface Params {
    models: CmsModel[];
    apps: IAcoApp[];
    plugins: CmsFieldTypePlugins;
}

export const createAppsSchema = (params: Params): string => {
    const { apps, models, plugins } = params;
    return apps
        .map(app => {
            return createAppSchema({
                app,
                models,
                plugins
            });
        })
        .join("\n");
};
