import { CmsModel, CmsFieldTypePlugins, ApiEndpoint } from "~/types";
import { renderListFilterFields } from "~/utils/renderListFilterFields";
import { renderSortEnum } from "~/utils/renderSortEnum";
import { renderFields } from "~/utils/renderFields";
import { renderGetFilterFields } from "~/utils/renderGetFilterFields";
import { CmsGraphQLSchemaSorterPlugin } from "~/plugins";

interface CreateReadSDLParams {
    models: CmsModel[];
    model: CmsModel;
    fieldTypePlugins: CmsFieldTypePlugins;
    sorterPlugins: CmsGraphQLSchemaSorterPlugin[];
}
interface CreateReadSDL {
    (params: CreateReadSDLParams): string;
}

export const createReadSDL: CreateReadSDL = ({
    models,
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
        models,
        model,
        type,
        fieldTypePlugins
    });

    if (fieldsRender.length === 0) {
        return "";
    }

    const hasModelIdField = model.fields.some(f => f.fieldId === "modelId");

    const { singularApiName: singularName, pluralApiName: pluralName } = model;

    return `
        """${model.description || singularName}"""
        type ${singularName} {
            id: ID!
            entryId: String!
            ${hasModelIdField ? "" : "modelId: String!"}
            createdOn: DateTime!
            savedOn: DateTime!
            createdBy: CmsIdentity!
            ownedBy: CmsIdentity!
            ${fieldsRender.map(f => f.fields).join("\n")}
        }
        
        ${fieldsRender
            .map(f => f.typeDefs)
            .filter(Boolean)
            .join("\n")}
        
        ${
            getFilterFieldsRender &&
            `input ${singularName}GetWhereInput {
            ${getFilterFieldsRender}
        }`
        }
        
        
        ${
            listFilterFieldsRender &&
            `input ${singularName}ListWhereInput {
                ${listFilterFieldsRender}
                AND: [${singularName}ListWhereInput!]
                OR: [${singularName}ListWhereInput!]
        }`
        }
        
        
        ${
            sortEnumRender &&
            `enum ${singularName}ListSorter {
            ${sortEnumRender}
        }`
        }
        
        type ${singularName}Response {
            data: ${singularName}
            error: CmsError
        }
        
        type ${singularName}ListResponse {
            data: [${singularName}]
            meta: CmsListMeta
            error: CmsError
        }
        
        extend type Query {
            get${singularName}(where: ${singularName}GetWhereInput!): ${singularName}Response

            list${pluralName}(
                where: ${singularName}ListWhereInput
                sort: [${singularName}ListSorter]
                limit: Int
                after: String
            ): ${singularName}ListResponse
        }
    `;
};
