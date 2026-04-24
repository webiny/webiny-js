import type { CmsModel, CmsModelField } from "@webiny/api-headless-cms/types/index.js";
import { renderFields } from "@webiny/api-headless-cms/utils/renderFields.js";
import { renderInputFields } from "@webiny/api-headless-cms/utils/renderInputFields.js";
import { renderListFilterFields } from "@webiny/api-headless-cms/utils/renderListFilterFields.js";
import type { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/exports/api/cms/graphql.js";

export interface CreateFilesTypeDefsParams {
    model: CmsModel;
    models: CmsModel[];
    fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
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
    const { model, models, fieldRegistry } = params;
    const { fields } = model;

    const fieldTypes = renderFields({
        models,
        model,
        fields,
        type: "manage",
        fieldRegistry
    });
    const inputCreateFields = renderInputFields({
        models,
        model,
        fields,
        fieldRegistry
    });
    const inputUpdateFields = renderInputFields({
        models,
        model,
        fields: createUpdateFields(fields),
        fieldRegistry
    });
    const listFilterFieldsRender = renderListFilterFields({
        model,
        fields: model.fields,
        type: "manage",
        fieldRegistry,
        excludeFields: ["entryId", "status"]
    });

    return /* GraphQL */ `
        type FmFile_Location {
            folderId: ID!
        }

        input FmFile_LocationInput {
            folderId: ID!
        }

        input FmFile_LocationWhereInput {
            folderId: ID
            folderId_in: [ID!]
            folderId_not: ID
            folderId_not_in: [ID!]
        }
        
        ${fieldTypes.map(f => f.typeDefs).join("\n")}

        type FmFile {
            id: ID!
            createdOn: DateTime!
            modifiedOn: DateTime
            savedOn: DateTime!
            createdBy: FmCreatedBy!
            modifiedBy: FmCreatedBy
            savedBy: FmCreatedBy!
            location: FmFile_Location!
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
            location: FmFile_LocationInput
            ${inputCreateFields.map(f => f.fields).join("\n")}
        }

        input FmFileUpdateInput {
            createdOn: DateTime
            modifiedOn: DateTime
            savedOn: DateTime
            createdBy: FmCreatedByInput
            modifiedBy: FmCreatedByInput
            savedBy: FmCreatedByInput
            location: FmFile_LocationInput
            ${inputUpdateFields.map(f => f.fields).join("\n")}
        }

        type FmFileResponse {
            data: FmFile
            error: FmError
        }

        input FmFileListWhereInput {
            ${listFilterFieldsRender.allFiltersAsString()}
            location: FmFile_LocationWhereInput
            AND: [FmFileListWhereInput!]
            OR: [FmFileListWhereInput!]
        }

        type FmFileListResponse {
            data: [FmFile!]
            error: FmError
            meta: FmListMeta
        }

        enum FmFileListSorter {
            savedOn_ASC
            savedOn_DESC
            createdOn_ASC
            createdOn_DESC
            name_ASC
            name_DESC
            key_ASC
            key_DESC
            type_ASC
            type_DESC
            size_ASC
            size_DESC
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
