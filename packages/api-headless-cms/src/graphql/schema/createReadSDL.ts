import type { CmsModel, CmsFieldTypePlugins, ApiEndpoint } from "~/types/index.js";
import { renderListFilterFields } from "~/utils/renderListFilterFields.js";
import { renderSortEnum } from "~/utils/renderSortEnum.js";
import { renderFields } from "~/utils/renderFields.js";
import { renderGetFilterFields } from "~/utils/renderGetFilterFields.js";
import type { CmsGraphQLSchemaSorterPlugin } from "~/plugins/index.js";
import { ENTRY_META_FIELDS, isDateTimeEntryMetaField } from "~/constants.js";

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

    const fieldsRender = renderFields({
        models,
        model,
        fields: model.fields,
        type,
        fieldTypePlugins
    });

    const listFilterFieldsRender = renderListFilterFields({
        model,
        fields: model.fields,
        type,
        fieldTypePlugins
    });
    const sortEnumRender = renderSortEnum({
        model,
        fields: model.fields,
        fieldTypePlugins,
        sorterPlugins
    });
    const getFilterFieldsRender = renderGetFilterFields({
        fields: model.fields,
        fieldTypePlugins
    });

    const hasModelIdField = model.fields.some(f => f.fieldId === "modelId");

    const { singularApiName: singularName, pluralApiName: pluralName } = model;

    const onByMetaGqlFields = ENTRY_META_FIELDS.map(field => {
        const fieldType = isDateTimeEntryMetaField(field) ? "DateTime" : "CmsIdentity";

        return `${field}: ${fieldType}`;
    }).join("\n");

    return `
        """${model.description || singularName}"""
        type ${singularName} {
            id: ID!
            entryId: String!
            ${hasModelIdField ? "" : "modelId: String!"}
            
            ${onByMetaGqlFields}
            ${fieldsRender.map(f => f.fields).join("\n")}
        }
        
        ${fieldsRender
            .map(f => f.typeDefs)
            .filter(Boolean)
            .join("\n")}
        
        input ${singularName}GetWhereInput {
            ${getFilterFieldsRender}
        }
        
        
        input ${singularName}ListWhereInput {
            ${listFilterFieldsRender}
            AND: [${singularName}ListWhereInput!]
            OR: [${singularName}ListWhereInput!]
        }
        
        
        enum ${singularName}ListSorter {
            ${sortEnumRender}
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
                search: String
            ): ${singularName}ListResponse
        }
    `;
};
