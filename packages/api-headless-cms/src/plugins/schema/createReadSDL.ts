import pluralize from "pluralize";
import { CmsModel, CmsFieldTypePlugins } from "@webiny/api-headless-cms/types";
import { GraphQLContext } from "@webiny/api/types";
import { createReadTypeName, createTypeName } from "../utils/createTypeName";
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

export const createReadSDL: CreateManageSDL = ({ model, fieldTypePlugins }): string => {
    const typeName = createTypeName(model.modelId);
    const rTypeName = createReadTypeName(typeName);

    return `
        "${model.description}"
        type ${rTypeName} {
            id: ID
            createdBy: SecurityUser
            updatedBy: SecurityUser
            createdOn: DateTime
            updatedOn: DateTime
            savedOn: DateTime
            ${renderFields({ model, type: "read", fieldTypePlugins })}
        }
        
        input ${rTypeName}GetWhereInput {
            ${renderGetFilterFields({ model, fieldTypePlugins })}
        }
        
        input ${rTypeName}ListWhereInput {
            id: ID
            id_not: ID
            id_in: [ID]
            id_not_in: [ID]
            ${renderListFilterFields({ model, type: "read", fieldTypePlugins })}
        }
        
        enum ${rTypeName}ListSorter {
            createdOn_ASC
            createdOn_DESC
            updatedOn_ASC
            updatedOn_DESC
            ${renderSortEnum({ model, fieldTypePlugins })}
        }
        
        type ${rTypeName}Response {
            data: ${rTypeName}
            error: CmsError
        }
        
        type ${rTypeName}ListResponse {
            data: [${rTypeName}]
            meta: CmsListMeta
            error: CmsError
        }
        
        extend type CmsReadQuery {
            get${typeName}(locale: String, where: ${rTypeName}GetWhereInput!): ${rTypeName}Response

            list${pluralize(typeName)}(
                locale: String
                page: Int
                perPage: Int
                where: ${rTypeName}ListWhereInput
                sort: [${rTypeName}ListSorter]
            ): ${rTypeName}ListResponse
        }
    `;
};
