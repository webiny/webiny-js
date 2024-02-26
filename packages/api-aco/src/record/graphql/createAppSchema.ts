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
    const { singularApiName: apiName, fields } = model;

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


        type ${apiName} {
            id: ID!
            createdOn: DateTime!
            modifiedOn: DateTime
            savedOn: DateTime!
            createdBy: AcoUser!
            modifiedBy: AcoUser
            savedBy: AcoUser!
            ${fieldTypes.map(f => f.fields).join("\n")}
        }

        ${inputCreateFields.map(f => f.typeDefs).join("\n")}

        input ${apiName}CreateInput {
            id: ID
            ${inputCreateFields.map(f => f.fields).join("\n")}
        }

        input ${apiName}UpdateInput {
            ${inputUpdateFields.map(f => f.fields).join("\n")}
        }

        type ${apiName}Response {
            data: ${apiName}
            error: AcoError
        }

        input ${apiName}ListWhereInput {
            ${listFilterFieldsRender}
            AND: [${apiName}ListWhereInput!]
            OR: [${apiName}ListWhereInput!]
        }

        type ${apiName}ListResponse {
            data: [${apiName}!]
            error: AcoError
            meta: AcoMeta
        }

        enum ${apiName}ListSorter {
            ${sortEnumRender}
        }

        extend type SearchQuery {
            get${apiName}(id: ID!): ${apiName}Response!
            list${apiName}(
                where: ${apiName}ListWhereInput
                search: String
                limit: Int
                after: String
                sort: [${apiName}ListSorter!]
            ): ${apiName}ListResponse!
            list${apiName}Tags(where: AcoSearchRecordTagListWhereInput): AcoSearchRecordTagListResponse!
        }

        extend type SearchMutation {
            create${apiName}(data: ${apiName}CreateInput!): ${apiName}Response!
            update${apiName}(id: ID!, data: ${apiName}UpdateInput!): ${apiName}Response!
            move${apiName}(id: ID!, folderId: ID!): AcoSearchRecordMoveResponse!
            delete${apiName}(id: ID!): AcoBooleanResponse!
        }
    `;
};
