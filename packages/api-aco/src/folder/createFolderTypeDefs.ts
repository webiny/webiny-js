import type { CmsFieldTypePlugins, CmsModel, CmsModelField } from "@webiny/api-headless-cms/types";
import { renderFields } from "@webiny/api-headless-cms/utils/renderFields";
import { renderInputFields } from "@webiny/api-headless-cms/utils/renderInputFields";

export interface CreateFolderTypeDefsParams {
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

export const createFolderTypeDefs = (params: CreateFolderTypeDefsParams): string => {
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

    return /* GraphQL */ `
        ${fieldTypes.map(f => f.typeDefs).join("\n")}
       
        type CompressedResponse {
            compression: String
            value: String
        }

        type Folder {
            id: ID!
            # Tells us if the current user can manage folder structure.
            canManageStructure: Boolean

            # Tells us if the current user can manage folder permissions.
            canManagePermissions: Boolean

            # Tells us if the current user can manage folder content.
            canManageContent: Boolean

            # Tells us if the folder contains non-inherited permissions.
            hasNonInheritedPermissions: Boolean

            createdOn: DateTime
            modifiedOn: DateTime
            savedOn: DateTime
            createdBy: AcoUser
            modifiedBy: AcoUser
            savedBy: AcoUser
            
            ${fieldTypes.map(f => f.fields).join("\n")}
        }

        ${inputCreateFields.map(f => f.typeDefs).join("\n")}
        
        input FolderCreateInput {
             # Pass an ID if you want to create a folder with a specific ID.
             id: ID  
             
             ${inputCreateFields.map(f => f.fields).join("\n")}
        }
                
         input FolderUpdateInput {
            ${inputUpdateFields.map(f => f.fields).join("\n")}
        }
        
        input FoldersListWhereInput {
            type: String!
            parentId: ID
            parentId_in: [ID]
            slug: String
            slug_not: String
            slug_contains: String
            slug_not_contains: String
            slug_in: [String]
            slug_not_in: [String]
            slug_startsWith: String
            slug_not_startsWith: String
            path: String
            path_not: String
            path_contains: String
            path_not_contains: String
            path_in: [String]
            path_not_in: [String]
            path_startsWith: String
            path_not_startsWith: String
            createdBy: ID
        }
        
        type FolderResponse {
            data: Folder
            error: AcoError
        }

        type FoldersListResponse {
            data: [Folder]
            error: AcoError
            meta: AcoMeta
        }

        type FoldersListCompressedResponse {
            data: CompressedResponse
            error: AcoError
        }
        
        type FoldersHierarchyData {
            parents: [Folder]
            siblings: [Folder]
        }

        type FoldersHierarchyResponse {
            data: FoldersHierarchyData
            error: AcoError
        }

        type FolderLevelPermissionsTarget {
            id: ID!
            type: String!
            target: ID!
            name: String!
            meta: JSON
        }

        type FolderLevelPermissionsTargetsListMeta {
            totalCount: Int!
        }

        type FolderLevelPermissionsTargetsListResponse {
            data: [FolderLevelPermissionsTarget]
            meta: FolderLevelPermissionsTargetsListMeta
            error: AcoError
        }
        
         type FolderModelResponse {
            data: JSON
            error: AcoError
        }

        extend type AcoQuery {
            getFolderModel: FolderModelResponse!
            getFolder(id: ID!): FolderResponse
            listFolders(
                where: FoldersListWhereInput!
                limit: Int
                after: String
                sort: AcoSort
            ): FoldersListResponse
            listFoldersCompressed(
                where: FoldersListWhereInput!
                limit: Int
                after: String
                sort: AcoSort
            ): FoldersListCompressedResponse
            getFolderHierarchy(type: String!, id: ID!): FoldersHierarchyResponse
            listFolderLevelPermissionsTargets: FolderLevelPermissionsTargetsListResponse
        }

        extend type AcoMutation {
            createFolder(data: FolderCreateInput!): FolderResponse
            updateFolder(id: ID!, data: FolderUpdateInput!): FolderResponse
            deleteFolder(id: ID!): AcoBooleanResponse
        }
        
        extend type AcoFolder_Permissions {
             inheritedFrom: ID
        }
        
         extend input AcoFolder_PermissionsInput {
             inheritedFrom: ID
        }
    `;
};
