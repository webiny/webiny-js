import pluralize from "pluralize";
import { CmsFieldTypePlugins, CmsModel } from "@webiny/api-headless-cms/types";
import { GraphQLContext } from "@webiny/api/types";
import { createManageTypeName, createTypeName } from "../utils/createTypeName";
import { renderInputFields } from "../utils/renderInputFields";
import { renderSortEnum } from "../utils/renderSortEnum";
import { renderFields } from "../utils/renderFields";
import { renderListFilterFields } from "../utils/renderListFilterFields";

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
        
        input ${mTypeName}FilterInput {
            id: ID
            id_not: ID
            id_in: [ID]
            id_not_in: [ID]
            ${renderListFilterFields({ model, type: "manage", fieldTypePlugins })}
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
        
        enum ${mTypeName}Sorter {
            createdOn_ASC
            createdOn_DESC
            updatedOn_ASC
            updatedOn_DESC
            ${renderSortEnum({ model, fieldTypePlugins })}
        }
        
        extend type CmsManageQuery {
            get${typeName}(id: ID, locale: String): ${mTypeName}Response
            
            list${pluralize(typeName)}(
                locale: String
                page: Int
                perPage: Int
                sort: [${mTypeName}Sorter]
                where: ${mTypeName}FilterInput
            ): ${mTypeName}ListResponse
        }
        
        extend type CmsManageMutation{
            create${typeName}(data: ${mTypeName}Input!): ${mTypeName}Response
            update${typeName}(id: ID!, data: ${mTypeName}Input!): ${mTypeName}Response
            delete${typeName}(id: ID!): CmsDeleteResponse
        }
    `;
};
