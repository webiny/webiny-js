import { CmsFieldTypePlugins, CmsModel, CmsModelField } from "@webiny/api-headless-cms/types";
import { renderFields } from "@webiny/api-headless-cms/utils/renderFields";
import { renderInputFields } from "@webiny/api-headless-cms/utils/renderInputFields";
import { renderListFilterFields } from "@webiny/api-headless-cms/utils/renderListFilterFields";
import { renderSortEnum } from "@webiny/api-headless-cms/utils/renderSortEnum";

export interface CreateFilesTypeDefsParams {
    model: CmsModel;
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
        collection.push(removeFieldRequiredValidation({ ...field }));
        return collection;
    }, []);
};

export const createFilesTypeDefs = (params: CreateFilesTypeDefsParams): string => {
    const { model, models, plugins: fieldTypePlugins } = params;
    const { fields } = model;

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
        fieldTypePlugins,
        excludeFields: ["entryId", "status"]
    });

    const excludeFromSorterts = ["tags", "aliases"];

    const sortEnumRender = renderSortEnum({
        model,
        fields: model.fields.filter(field => !excludeFromSorterts.includes(field.fieldId)),
        fieldTypePlugins,
        sorterPlugins: []
    });

    return /* GraphQL */ `
        ${fieldTypes.map(f => f.typeDefs).join("\n")}

        type FmFile {
            id: ID!
            createdOn: DateTime!
            modifiedOn: DateTime
            savedOn: DateTime!
            createdBy: FmCreatedBy!
            modifiedBy: FmCreatedBy
            savedBy: FmCreatedBy!
            src: String
            ${fieldTypes.map(f => f.fields).join("\n")}
        }

        ${inputCreateFields.map(f => f.typeDefs).join("\n")}
        
        input FmCreatedByInput {
            id: ID!
            displayName: String!
            type: String!
        }

        input FmFileCreateInput {
            id: ID!
            createdOn: DateTime
            modifiedOn: DateTime
            savedOn: DateTime
            createdBy: FmCreatedByInput
            modifiedBy: FmCreatedByInput
            savedBy: FmCreatedByInput
            ${inputCreateFields.map(f => f.fields).join("\n")}
        }

        input FmFileUpdateInput {
            createdOn: DateTime
            modifiedOn: DateTime
            savedOn: DateTime
            createdBy: FmCreatedByInput
            modifiedBy: FmCreatedByInput
            savedBy: FmCreatedByInput
            ${inputUpdateFields.map(f => f.fields).join("\n")}
        }

        type FmFileResponse {
            data: FmFile
            error: FmError
        }

        input FmFileListWhereInput {
            ${listFilterFieldsRender}
            AND: [FmFileListWhereInput!]
            OR: [FmFileListWhereInput!]
        }

        type FmFileListResponse {
            data: [FmFile!]
            error: FmError
            meta: FmListMeta
        }

        enum FmFileListSorter {
            ${sortEnumRender}
        }

        input FmTagsListWhereInput {
            createdBy: String
            tags_startsWith: String
            tags_not_startsWith: String
        }

        type FmTag {
            tag: String!
            count: Number!
        }

        type FmTagsListResponse {
            data: [FmTag!]
            error: FmError
        }

        type FmCreateFilesResponse {
            data: [FmFile!]
            error: FmError
        }
        
        type FmFileModelResponse {
            data: JSON
            error: FmError
        }

        extend type FmQuery {
            getFileModel: FmFileModelResponse!
            getFile(id: ID!): FmFileResponse!
            listFiles(
                search: String
                where: FmFileListWhereInput
                limit: Int
                after: String
                sort: [FmFileListSorter!]
            ): FmFileListResponse!
            listTags(where: FmTagsListWhereInput): FmTagsListResponse!
        }

        extend type FmMutation {
            createFile(data: FmFileCreateInput!): FmFileResponse!
            createFiles(data: [FmFileCreateInput!]!): FmCreateFilesResponse!
            updateFile(id: ID!, data: FmFileUpdateInput!): FmFileResponse!
            deleteFile(id: ID!): FmBooleanResponse!
        }
    `;
};
