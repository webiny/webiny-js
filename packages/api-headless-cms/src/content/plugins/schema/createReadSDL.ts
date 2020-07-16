import { CmsContentModel, CmsFieldTypePlugins, CmsContext } from "@webiny/api-headless-cms/types";
import { createReadTypeName, createTypeName } from "../utils/createTypeName";
import { renderSortEnum } from "../utils/renderSortEnum";
import { renderFields } from "../utils/renderFields";
import { renderListFilterFields } from "../utils/renderListFilterFields";
import { renderGetFilterFields } from "../utils/renderGetFilterFields";
import { pluralizedTypeName } from "../utils/pluralizedTypeName";

export interface CreateManageSDL {
    (params: {
        model: CmsContentModel;
        context: CmsContext;
        fieldTypePlugins: CmsFieldTypePlugins;
    }): string;
}

export const createReadSDL: CreateManageSDL = ({ model, fieldTypePlugins }): string => {
    const typeName = createTypeName(model.modelId);
    const rTypeName = createReadTypeName(typeName);

    const listFilterFieldsRender = renderListFilterFields({
        model,
        type: "read",
        fieldTypePlugins
    });

    const sortEnumRender = renderSortEnum({ model, fieldTypePlugins });
    const getFilterFieldsRender = renderGetFilterFields({ model, fieldTypePlugins });

    const fieldsRender = renderFields({ model, type: "read", fieldTypePlugins });

    return `
        "${model.description}"
        type ${rTypeName} {
            id: ID
            createdBy: SecurityUser
            updatedBy: SecurityUser
            createdOn: DateTime
            updatedOn: DateTime
            savedOn: DateTime
            ${fieldsRender.map(f => f.fields).join("\n")}
        }
        
        ${getFilterFieldsRender &&
            `input ${rTypeName}GetWhereInput {
            ${getFilterFieldsRender}
        }`}
        
        
        ${listFilterFieldsRender &&
            `input ${rTypeName}ListWhereInput {
            ${listFilterFieldsRender}
        }`}
        
        
        ${sortEnumRender &&
            `enum ${rTypeName}ListSorter {
            ${sortEnumRender}
        }`}
        
        type ${rTypeName}Response {
            data: ${rTypeName}
            error: CmsError
        }
        
        type ${rTypeName}ListResponse {
            data: [${rTypeName}]
            meta: CmsListMeta
            error: CmsError
        }
        
        extend type Query {
            get${typeName}(locale: String, where: ${rTypeName}GetWhereInput!): ${rTypeName}Response

            list${pluralizedTypeName(typeName)}(
                locale: String
                where: ${rTypeName}ListWhereInput
                sort: [${rTypeName}ListSorter]
                limit: Int
                after: String
                before: String
            ): ${rTypeName}ListResponse
        }
    `;
};
