import pluralize from "pluralize";
import { CmsFieldTypePlugins, CmsModel } from "@webiny/api-headless-cms/types";
import { GraphQLContext } from "@webiny/api/types";
import { createManageTypeName, createTypeName } from "../utils/createTypeName";
import { renderInputFields } from "../utils/renderInputFields";
import { renderSortEnum } from "../utils/renderSortEnum";
import { renderFields } from "../utils/renderFields";
import { renderListFilterFields } from "../utils/renderListFilterFields";
import { renderGetFilterFields } from "../utils/renderGetFilterFields";

export interface CreateManageSDL {
    (params: {
        model: CmsModel;
        context: GraphQLContext;
        fieldTypePlugins: CmsFieldTypePlugins;
    }): string;
}

export const createManageSDL: CreateManageSDL = ({ model, fieldTypePlugins }): string => {
    const typeName = createTypeName(model.modelId);
    const mTypeName = createManageTypeName(typeName);

    return `
        "${model.description}"
        type ${mTypeName} {
            id: ID
            createdBy: SecurityUser
            updatedBy: SecurityUser
            createdOn: DateTime
            updatedOn: DateTime
            savedOn: DateTime
            ${renderFields({ model, type: "manage", fieldTypePlugins })}
        }
        
        input ${mTypeName}Input {
            ${renderInputFields({ model, fieldTypePlugins })}
        }
        
        input ${mTypeName}GetWhereInput {
            ${renderGetFilterFields({ model, fieldTypePlugins })}
        }
        
        input ${mTypeName}ListWhereInput {
            id: ID
            id_not: ID
            id_in: [ID]
            id_not_in: [ID]
            ${renderListFilterFields({ model, type: "manage", fieldTypePlugins })}
        }
        
        input ${mTypeName}UpdateWhereInput {
            ${renderGetFilterFields({ model, fieldTypePlugins })}
        }
        
        input ${mTypeName}DeleteWhereInput {
            ${renderGetFilterFields({ model, fieldTypePlugins })}
        }
        
        type ${mTypeName}Response {
            data: ${mTypeName}
            error: CmsError
        }
        
        type ${mTypeName}ListResponse {
            data: [${mTypeName}]
            meta: CmsListMeta
            error: CmsError
        }
        
        enum ${mTypeName}ListSorter {
            createdOn_ASC
            createdOn_DESC
            updatedOn_ASC
            updatedOn_DESC
            ${renderSortEnum({ model, fieldTypePlugins })}
        }
        
        extend type CmsManageQuery {
            get${typeName}(where: ${mTypeName}GetWhereInput!): ${mTypeName}Response
            
            list${pluralize(typeName)}(
                page: Int
                perPage: Int
                sort: [${mTypeName}ListSorter]
                where: ${mTypeName}ListWhereInput
            ): ${mTypeName}ListResponse
        }
        
        extend type CmsManageMutation{
            create${typeName}(data: ${mTypeName}Input!): ${mTypeName}Response
            
            update${typeName}(where: ${mTypeName}UpdateWhereInput!, data: ${mTypeName}Input!): ${mTypeName}Response
            
            delete${typeName}(where: ${mTypeName}DeleteWhereInput!): CmsDeleteResponse
        }
    `;
};
