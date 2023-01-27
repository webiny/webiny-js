import { CmsModel, CmsFieldTypePlugins, ApiEndpoint } from "~/types";
import { createReadTypeName, createTypeName } from "~/utils/createTypeName";
import { renderListFilterFields } from "~/utils/renderListFilterFields";
import { renderSortEnum } from "~/utils/renderSortEnum";
import { renderFields } from "~/utils/renderFields";
import { renderGetFilterFields } from "~/utils/renderGetFilterFields";
import { pluralizedTypeName } from "~/utils/pluralizedTypeName";

interface CreateReadSDLParams {
    model: CmsModel;
    fieldTypePlugins: CmsFieldTypePlugins;
}
interface CreateReadSDL {
    (params: CreateReadSDLParams): string;
}

export const createReadSDL: CreateReadSDL = ({ model, fieldTypePlugins }): string => {
    const typeName = createTypeName(model.modelId);
    const rTypeName = createReadTypeName(typeName);

    const type: ApiEndpoint = "read";

    const listFilterFieldsRender = renderListFilterFields({
        model,
        type,
        fieldTypePlugins
    });

    const sortEnumRender = renderSortEnum({
        model,
        fieldTypePlugins
    });
    const getFilterFieldsRender = renderGetFilterFields({
        model,
        fieldTypePlugins
    });
    const fieldsRender = renderFields({
        model,
        type,
        fieldTypePlugins
    });

    if (fieldsRender.length === 0) {
        return "";
    }

    return `
        """${model.description || ""}"""
        type ${rTypeName} {
            id: ID!
            entryId: String!
            modelId: String!
            createdOn: DateTime!
            savedOn: DateTime!
            createdBy: CmsCreatedBy!
            ownedBy: CmsOwnedBy!
            ${fieldsRender.map(f => f.fields).join("\n")}
        }
        
        ${fieldsRender
            .map(f => f.typeDefs)
            .filter(Boolean)
            .join("\n")}
        
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
                AND: [${rTypeName}ListWhereInput!]
                OR: [${rTypeName}ListWhereInput!]
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
