import type { CmsModel } from "~/types/index.js";
import { renderListFilterFields } from "~/utils/renderListFilterFields.js";
import { renderSortEnum } from "~/utils/renderSortEnum.js";
import { renderGetFilterFields } from "~/utils/renderGetFilterFields.js";
import { renderInputFields } from "~/utils/renderInputFields.js";
import { renderFields } from "~/utils/renderFields.js";
import { ENTRY_META_FIELDS, isDateTimeEntryMetaField } from "~/constants.js";
import {
    CmsGraphQLSchemaSorter,
    type CmsModelFieldToGraphQLRegistry
} from "~/features/graphql/index.js";

interface CreateManageSDLParams {
    models: CmsModel[];
    model: CmsModel;
    fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
    sorters: CmsGraphQLSchemaSorter.Interface[];
}

interface CreateManageSDL {
    (params: CreateManageSDLParams): string;
}

export const createManageSDL: CreateManageSDL = ({
    models,
    model,
    fieldRegistry,
    sorters
}): string => {
    const inputFields = renderInputFields({
        models,
        model,
        fields: model.fields,
        fieldRegistry
    });

    const listFilterFieldsRender = renderListFilterFields({
        model,
        fields: model.fields,
        type: "manage",
        fieldRegistry
    });

    const sortEnumRender = renderSortEnum({
        model,
        fields: model.fields,
        fieldRegistry,
        sorters
    });
    const getFilterFieldsRender = renderGetFilterFields({
        fields: model.fields,
        fieldRegistry
    });

    const fields = renderFields({
        models,
        model,
        fields: model.fields,
        type: "manage",
        fieldRegistry
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

    // Had to remove /* GraphQL */ because it causes issues with oxfmt formatting.
    return `
        """${model.description || singularName}"""
        
        type ${singularName}Values {
            ${fields.map(f => f.fields).join("\n") || "_empty: String"}
        }
        
        type ${singularName} {
            id: ID!
            entryId: String!
            
            ${onByMetaGqlFields}
            meta: ${singularName}Meta
            wbyAco_location: WbyAcoLocation
            live: CmsEntryLive
            
            values: ${singularName}Values
        }

        type ${singularName}Meta {
            modelId: String
            version: Int
            locked: Boolean
            
            status: String
            system: CmsEntrySystem
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
        
        input ${singularName}InputValues {
            ${inputGqlFields || "_empty: String"}
        }
        
        input ${singularName}Input {
            id: ID
            
            # Set status of the entry.
            status: String
            
            ${onByMetaInputGqlFields}
            
            wbyAco_location: WbyAcoLocationInput
            
            values: ${singularName}InputValues
        }
        
        input ${singularName}GetWhereInputValues {
            ${getFilterFieldsRender.fieldFiltersAsString() || "_empty: String"}
        }
        
        input ${singularName}GetWhereInput {
            ${getFilterFieldsRender.baseFiltersAsString()}
            values: ${singularName}GetWhereInputValues
        }
        
        input ${singularName}ListWhereInputValues {
            ${listFilterFieldsRender.fieldFiltersAsString() || "_empty: String"}
        }

        input ${singularName}ListWhereInput {
            ${listFilterFieldsRender.baseFiltersAsString()}

            system: ListWhereInputCmsEntrySystem
            wbyAco_location: WbyAcoLocationWhereInput
            live: CmsEntryLiveWhereInput
            
            values: ${singularName}ListWhereInputValues
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
