import pluralize from "pluralize";
import { CmsFieldTypePlugins, CmsContext, CmsModel } from "@webiny/api-headless-cms/types";
import { createManageTypeName, createTypeName } from "../utils/createTypeName";
import { renderInputFields } from "../utils/renderInputFields";
import { renderSortEnum } from "../utils/renderSortEnum";
import { renderFields } from "../utils/renderFields";
import { renderListFilterFields } from "../utils/renderListFilterFields";
import { renderGetFilterFields } from "../utils/renderGetFilterFields";

export interface CreateManageSDL {
    (params: {
        model: CmsModel;
        context: CmsContext;
        fieldTypePlugins: CmsFieldTypePlugins;
    }): string;
}

export const createManageSDL: CreateManageSDL = ({ model, fieldTypePlugins }): string => {
    const typeName = createTypeName(model.modelId);
    const mTypeName = createManageTypeName(typeName);

    return /* GraphQL */ `
        type ${mTypeName}Meta {
            model: String
            environment: ID
            parent: ID
            version: Int
            latestVersion: Boolean
            locked: Boolean
            published: Boolean
            publishedOn: DateTime
            status: String
            revisions: [${mTypeName}]
            title: CmsText
        }
        
        "${model.description}"
        type ${mTypeName} {
            id: ID
            createdBy: SecurityUser
            updatedBy: SecurityUser
            createdOn: DateTime
            updatedOn: DateTime
            savedOn: DateTime
            meta: ${mTypeName}Meta
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
        
        extend type Query {
            get${typeName}(where: ${mTypeName}GetWhereInput!): ${mTypeName}Response
            
            list${pluralize(typeName)}(
                where: ${mTypeName}ListWhereInput
                sort: [${mTypeName}ListSorter]
                limit: Int
                after: String
                before: String
            ): ${mTypeName}ListResponse
        }
        
        extend type Mutation{
            create${typeName}(data: ${mTypeName}Input!): ${mTypeName}Response
            
            create${typeName}From(revision: ID!, data: ${mTypeName}Input): ${mTypeName}Response
            
            update${typeName}(where: ${mTypeName}UpdateWhereInput!, data: ${mTypeName}Input!): ${mTypeName}Response
            
            delete${typeName}(where: ${mTypeName}DeleteWhereInput!): CmsDeleteResponse
            
            publish${typeName}(revision: ID!): ${mTypeName}Response
            
            unpublish${typeName}(revision: ID!): ${mTypeName}Response
        }
    `;
};
