import { CmsModel, CmsFieldTypePlugins } from "~/types";
import { createReadTypeName, createTypeName } from "~/content/plugins/utils/createTypeName";
import { renderListFilterFields } from "~/content/plugins/utils/renderListFilterFields";
import { renderSortEnum } from "~/content/plugins/utils/renderSortEnum";
import { renderFields } from "~/content/plugins/utils/renderFields";
import { renderGetFilterFields } from "~/content/plugins/utils/renderGetFilterFields";
import { pluralizedTypeName } from "~/content/plugins/utils/pluralizedTypeName";

interface CreateManageSDL {
    (params: { model: CmsModel; fieldTypePlugins: CmsFieldTypePlugins }): string;
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
        ${fieldsRender
            .map(f => f.typeDefs)
            .filter(Boolean)
            .join("\n")}
        
        type ${rTypeName} {
            id: ID!
            entryId: String!
            createdOn: DateTime!
            savedOn: DateTime!
            createdBy: CmsCreatedBy!
            ownedBy: CmsOwnedBy!
            ${fieldsRender.map(f => f.fields).join("\n")}
        }
        
        ${
            getFilterFieldsRender &&
            `input ${rTypeName}GetWhereInput {
            ${getFilterFieldsRender}
        }`
        }
        
        
        ${
            listFilterFieldsRender &&
            `input ${rTypeName}ListWhereInput {
            ${listFilterFieldsRender}
        }`
        }
        
        
        ${
            sortEnumRender &&
            `enum ${rTypeName}ListSorter {
            ${sortEnumRender}
        }`
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
