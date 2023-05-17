import { CmsFieldTypePlugins, CmsModel, CmsModelField } from "@webiny/api-headless-cms/types";
import { renderFields } from "@webiny/api-headless-cms/utils/renderFields";
import { renderInputFields } from "@webiny/api-headless-cms/utils/renderInputFields";
import { IAcoApp } from "~/types";
import { renderListFilterFields } from "@webiny/api-headless-cms/utils/renderListFilterFields";
import { renderSortEnum } from "@webiny/api-headless-cms/utils/renderSortEnum";

interface Params {
    app: IAcoApp;
    models: CmsModel[];
    plugins: CmsFieldTypePlugins;
}

const removeFieldRequiredValidation = (field: CmsModelField) => {
    if (field.validation) {
        field.validation = field.validation.filter(validation => validation.name !== "required");
    }
    if (field.listValidation) {
        field.listValidation = field.listValidation.filter(v => v.name !== "required");
    }
    return field;
};

const createUpdateFields = (fields: CmsModelField[]): CmsModelField[] => {
    return fields.reduce<CmsModelField[]>((collection, field) => {
        if (["type"].includes(field.fieldId)) {
            return collection;
        } else if (field.fieldId === "tags") {
            collection.push(field);
            return collection;
        }
        collection.push(removeFieldRequiredValidation({ ...field }));
        return collection;
    }, []);
};

export const createAppSchema = (params: Params): string => {
    const { app, models, plugins: fieldTypePlugins } = params;
    const { model } = app;
    const { singularApiName, pluralApiName, fields } = model;

    const fieldTypes = renderFields({
        models,
        model,
        fields,
        type: "manage",
        fieldTypePlugins
    });
    const inputCreateFields = renderInputFields({
        models,
        model,
        fields,
        fieldTypePlugins
    });
    const inputUpdateFields = renderInputFields({
        models,
        model,
        fields: createUpdateFields(fields),
        fieldTypePlugins
    });
    const listFilterFieldsRender = renderListFilterFields({
        model,
        fields: model.fields,
        type: "manage",
        fieldTypePlugins
    });

    const sortEnumRender = renderSortEnum({
        model,
        fields: model.fields,
        fieldTypePlugins
    });

    return /* GraphQL */ `
        ${fieldTypes.map(f => f.typeDefs).join("\n")}


        type ${singularApiName} {
            id: ID!
            savedOn: DateTime!
            createdOn: DateTime!
            createdBy: AcoUser!
            ${fieldTypes.map(f => f.fields).join("\n")}
        }

        ${inputCreateFields.map(f => f.typeDefs).join("\n")}

        input ${singularApiName}CreateInput {
            id: ID
            ${inputCreateFields.map(f => f.fields).join("\n")}
        }

        input ${singularApiName}UpdateInput {
            ${inputUpdateFields.map(f => f.fields).join("\n")}
        }

        type ${singularApiName}Response {
            data: ${singularApiName}
            error: AcoError
        }

        input ${singularApiName}ListWhereInput {
            ${listFilterFieldsRender}
            AND: [${singularApiName}ListWhereInput!]
            OR: [${singularApiName}ListWhereInput!]
        }

        type ${singularApiName}ListResponse {
            data: [${singularApiName}!]
            error: AcoError
            meta: AcoMeta
        }

        enum ${singularApiName}ListSorter {
            ${sortEnumRender}
        }

        extend type SearchQuery {
            get${singularApiName}(id: ID!): ${singularApiName}Response!
            list${pluralApiName}(
                where: ${singularApiName}ListWhereInput
                search: String
                limit: Int
                after: String
                sort: [${singularApiName}ListSorter!]
            ): ${singularApiName}ListResponse!
        }

        extend type SearchMutation {
            create${singularApiName}(data: ${singularApiName}CreateInput!): ${singularApiName}Response!
            update${singularApiName}(id: ID!, data: ${singularApiName}UpdateInput!): ${singularApiName}Response!
            delete${singularApiName}(id: ID!): AcoBooleanResponse!
        }
    `;
};
