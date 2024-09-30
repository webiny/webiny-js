import { CmsFieldTypePlugins, CmsModel } from "~/types";
import { renderListFilterFields } from "~/utils/renderListFilterFields";
import { renderSortEnum } from "~/utils/renderSortEnum";
import { renderGetFilterFields } from "~/utils/renderGetFilterFields";
import { renderInputFields } from "~/utils/renderInputFields";
import { renderFields } from "~/utils/renderFields";
import { CmsGraphQLSchemaSorterPlugin } from "~/plugins";
import { ENTRY_META_FIELDS, isDateTimeEntryMetaField } from "~/constants";

interface CreateManageSDLParams {
    models: CmsModel[];
    model: CmsModel;
    fieldTypePlugins: CmsFieldTypePlugins;
    sorterPlugins: CmsGraphQLSchemaSorterPlugin[];
}

interface CreateManageSDL {
    (params: CreateManageSDLParams): string;
}

export const createManageSDL: CreateManageSDL = ({
    models,
    model,
    fieldTypePlugins,
    sorterPlugins
}): string => {
    const inputFields = renderInputFields({
        models,
        model,
        fields: model.fields,
        fieldTypePlugins
    });

    const listFilterFieldsRender = renderListFilterFields({
        model,
        fields: model.fields,
        type: "manage",
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

    const fields = renderFields({
        models,
        model,
        fields: model.fields,
        type: "manage",
        fieldTypePlugins
    });

    const { singularApiName: singularName, pluralApiName: pluralName } = model;

    const inputGqlFields = inputFields.map(f => f.fields).join("\n");

    const onByMetaInputGqlFields = ENTRY_META_FIELDS.map(field => {
        const fieldType = isDateTimeEntryMetaField(field) ? "DateTime" : "CmsIdentityInput";

        return `${field}: ${fieldType}`;
    }).join("\n");

    const onByMetaGqlFields = ENTRY_META_FIELDS.map(field => {
        const fieldType = isDateTimeEntryMetaField(field) ? "DateTime" : "CmsIdentity";

        return `${field}: ${fieldType}`;
    }).join("\n");

    // Had to remove /* GraphQL */ because prettier would not format the code correctly.
    return `
        """${model.description || singularName}"""
        type ${singularName} {
            id: ID!
            entryId: String!
            
            ${onByMetaGqlFields}
            
            publishedOn: DateTime @deprecated(reason: "Field was removed with the 5.39.0 release. Use 'firstPublishedOn' or 'lastPublishedOn' field.")
            ownedBy: CmsIdentity @deprecated(reason: "Field was removed with the 5.39.0 release. Use 'createdBy' field.")
            
            meta: ${singularName}Meta
            ${fields.map(f => f.fields).join("\n")}
            # Advanced Content Organization - make required in 5.38.0
            wbyAco_location: WbyAcoLocation
        }

        type ${singularName}Meta {
            modelId: String
            version: Int
            locked: Boolean
            
            status: String
            """
            CAUTION: this field is resolved by making an extra query to DB.
            RECOMMENDATION: Use it only with "get" queries (avoid in "list")
            """
            revisions: [${singularName}!]
            title: String
            description: String
            image: String
            """
            Custom meta data stored in the root of the entry object.
            """
            data: JSON
        }

        ${fields.map(f => f.typeDefs).join("\n")}

        ${inputFields.map(f => f.typeDefs).join("\n")}
        
        input ${singularName}Input {
            id: ID
            
            # Set status of the entry.
            status: String
            
            ${onByMetaInputGqlFields}
            
            wbyAco_location: WbyAcoLocationInput
            
            ${inputGqlFields}
            
        }
        
        input ${singularName}GetWhereInput {
            ${getFilterFieldsRender}
        }

        input ${singularName}ListWhereInput {
            wbyAco_location: WbyAcoLocationWhereInput
            ${listFilterFieldsRender}
            AND: [${singularName}ListWhereInput!]
            OR: [${singularName}ListWhereInput!]
        }


        type ${singularName}Response {
            data: ${singularName}
            error: CmsError
        }
        
        type ${singularName}MoveResponse {
            data: Boolean
            error: CmsError
        }

        type ${singularName}ArrayResponse {
            data: [${singularName}]
            error: CmsError
        }

        type ${singularName}ListResponse {
            data: [${singularName}]
            meta: CmsListMeta
            error: CmsError
        }


        enum ${singularName}ListSorter {
            ${sortEnumRender}
        }

        extend type Query {
            get${singularName}(revision: ID, entryId: ID, status: CmsEntryStatusType): ${singularName}Response
    
            get${singularName}Revisions(id: ID!): ${singularName}ArrayResponse
    
            get${pluralName}ByIds(revisions: [ID!]!): ${singularName}ArrayResponse
    
            list${pluralName} (
                where: ${singularName}ListWhereInput
                sort: [${singularName}ListSorter]
                limit: Int
                after: String
                search: String
            ): ${singularName}ListResponse
            
            listDeleted${pluralName} (
                where: ${singularName}ListWhereInput
                sort: [${singularName}ListSorter]
                limit: Int
                after: String
                search: String
            ): ${singularName}ListResponse
        }

        extend type Mutation {
            create${singularName}(data: ${singularName}Input!, options: CreateCmsEntryOptionsInput): ${singularName}Response

            create${singularName}From(revision: ID!, data: ${singularName}Input, options: CreateRevisionCmsEntryOptionsInput): ${singularName}Response
    
            update${singularName}(revision: ID!, data: ${singularName}Input!, options: UpdateCmsEntryOptionsInput): ${singularName}Response

            validate${singularName}(revision: ID, data: ${singularName}Input!): CmsEntryValidationResponse!
            
            move${singularName}(revision: ID!, folderId: ID!): ${singularName}MoveResponse

            delete${singularName}(revision: ID!, options: CmsDeleteEntryOptions): CmsDeleteResponse
            
            restore${singularName}FromBin(revision: ID!): ${singularName}Response

            deleteMultiple${pluralName}(entries: [ID!]!): CmsDeleteMultipleResponse!
    
            publish${singularName}(revision: ID!): ${singularName}Response
    
            republish${singularName}(revision: ID!): ${singularName}Response
    
            unpublish${singularName}(revision: ID!): ${singularName}Response
        }
    `;
};
