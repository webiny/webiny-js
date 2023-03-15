import { CmsApiModel, CmsFieldTypePlugins, ApiEndpoint } from "~/types";
import { renderListFilterFields } from "~/utils/renderListFilterFields";
import { renderSortEnum } from "~/utils/renderSortEnum";
import { renderFields } from "~/utils/renderFields";
import { renderGetFilterFields } from "~/utils/renderGetFilterFields";
import { CmsGraphQLSchemaSorterPlugin } from "~/plugins";

interface CreateReadSDLParams {
    model: CmsApiModel;
    fieldTypePlugins: CmsFieldTypePlugins;
    sorterPlugins: CmsGraphQLSchemaSorterPlugin[];
}
interface CreateReadSDL {
    (params: CreateReadSDLParams): string;
}

export const createReadSDL: CreateReadSDL = ({
    model,
    fieldTypePlugins,
    sorterPlugins
}): string => {
    const type: ApiEndpoint = "read";

    const listFilterFieldsRender = renderListFilterFields({
        model,
        type,
        fieldTypePlugins
    });

    const sortEnumRender = renderSortEnum({
        model,
        fieldTypePlugins,
        sorterPlugins
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

    const hasModelIdField = model.fields.some(f => f.fieldId === "modelId");

    return `
        """${model.description || ""}"""
        type ${model.singularApiName} {
            id: ID!
            entryId: String!
            ${hasModelIdField ? "" : "modelId: String!"}
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
            `input ${model.singularApiName}GetWhereInput {
            ${getFilterFieldsRender}
        }`
        }
        
        
        ${
            listFilterFieldsRender &&
            `input ${model.singularApiName}ListWhereInput {
                ${listFilterFieldsRender}
                AND: [${model.singularApiName}ListWhereInput!]
                OR: [${model.singularApiName}ListWhereInput!]
        }`
        }
        
        
        ${
            sortEnumRender &&
            `enum ${model.singularApiName}ListSorter {
            ${sortEnumRender}
        }`
        }
        
        type ${model.singularApiName}Response {
            data: ${model.singularApiName}
            error: CmsError
        }
        
        type ${model.singularApiName}ListResponse {
            data: [${model.singularApiName}]
            meta: CmsListMeta
            error: CmsError
        }
        
        extend type Query {
            get${model.singularApiName}(where: ${model.singularApiName}GetWhereInput!): ${
        model.singularApiName
    }Response

            list${model.pluralApiName}(
                where: ${model.singularApiName}ListWhereInput
                sort: [${model.singularApiName}ListSorter]
                limit: Int
                after: String
            ): ${model.singularApiName}ListResponse
        }
    `;
};
