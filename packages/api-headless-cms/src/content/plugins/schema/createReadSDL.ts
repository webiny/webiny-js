import { CmsContentModel, CmsFieldTypePlugins } from "../../../types";
import { createReadTypeName, createTypeName } from "../utils/createTypeName";
import { renderSortEnum } from "../utils/renderSortEnum";
import { renderFields } from "../utils/renderFields";
import { renderListFilterFields } from "../utils/renderListFilterFields";
import { renderGetFilterFields } from "../utils/renderGetFilterFields";
import { pluralizedTypeName } from "../utils/pluralizedTypeName";

interface CreateManageSDL {
    (params: { model: CmsContentModel; fieldTypePlugins: CmsFieldTypePlugins }): string;
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
        """${model.description || ""}"""
        type ${rTypeName} {
            id: ID!
            entryId: String!
            createdOn: DateTime!
            savedOn: DateTime!
            createdBy: CmsCreatedBy!
            ownedBy: CmsOwnedBy!
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
            get${typeName}(where: ${rTypeName}GetWhereInput!): ${rTypeName}Response

            list${pluralizedTypeName(typeName)}(
                where: ${rTypeName}ListWhereInput
                sort: [${rTypeName}ListSorter]
                limit: Int
                after: String
            ): ${rTypeName}ListResponse
        }
    `;
};
