import type { ApiEndpoint, CmsModel } from "~/types/index.js";
import { renderInputFields } from "~/utils/renderInputFields.js";
import { renderFields } from "~/utils/renderFields.js";
import { ENTRY_META_FIELDS, isDateTimeEntryMetaField } from "~/constants.js";
import type { CmsModelFieldToGraphQLRegistry } from "~/features/graphql/index.js";

interface CreateSingularSDLParams {
    models: CmsModel[];
    model: CmsModel;
    fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface;
    type: ApiEndpoint;
}

interface CreateSingularSDL {
    (params: CreateSingularSDLParams): string;
}

export const createSingularSDL: CreateSingularSDL = ({
    models,
    model,
    fieldRegistry,
    type
}): string => {
    if (model.fields.length === 0) {
        return "";
    }

    const inputFields = renderInputFields({
        models,
        model,
        fields: model.fields,
        fieldRegistry
    });

    const fields = renderFields({
        models,
        model,
        fields: model.fields,
        type,
        fieldRegistry
    });

    const { singularApiName: singularName } = model;

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
    const shared = `
        """${model.description || singularName}"""
        
        type ${singularName}Values {
            ${fields.map(f => f.fields).join("\n") || "_empty: String"}
        }
        
        type ${singularName} {
            id: ID!
            entryId: String!
            
            ${onByMetaGqlFields}
            values: ${singularName}Values
            live: CmsEntryLive
            
            revisionDescription: String
        }

        ${fields.map(f => f.typeDefs).join("\n")}
        
        input ${singularName}ListWhereInput {
            id: String
        }

        type ${singularName}Response {
            data: ${singularName}
            error: CmsError
        }
    `;
    if (type !== "manage") {
        return `
            ${shared}
            
            extend type Query {
                get${singularName}: ${singularName}Response
            }
        `;
    }
    return `
        ${shared}
        
        type ${singularName}Meta {
            modelId: String
            version: Int
            locked: Boolean
            
            status: String
            system: CmsEntrySystem
            """
            CAUTION: this field is resolved by making an extra query to DB.
            """
            revisions: [${singularName}!]
            title: String
            description: String
            image: String
        }
        
        extend type ${singularName} {
            meta: ${singularName}Meta
        }
        
        type ${singularName}ArrayResponse {
            data: [${singularName}]
            error: CmsError
        }
    
        ${inputFields.map(f => f.typeDefs).join("\n")}
        
        input ${singularName}InputValues {
            ${inputGqlFields || "_empty: String"}
        }
        
        input ${singularName}Input {
            ${onByMetaInputGqlFields}
            values: ${singularName}InputValues!
        }
        
        extend type Query {
            get${singularName}Latest: ${singularName}Response
            
            get${singularName}Revision(revision: ID!): ${singularName}Response
            
            get${singularName}Revisions(id: ID!): ${singularName}ArrayResponse
        }
    
        extend type Mutation {
            update${singularName}(revision: ID!, data: ${singularName}Input!, options: UpdateCmsEntryOptionsInput): ${singularName}Response
            
            update${singularName}RevisionDescription(revision: ID!, revisionDescription: String): ${singularName}Response
            
            create${singularName}From(revision: ID!, data: ${singularName}Input, options: CreateRevisionCmsEntryOptionsInput): ${singularName}Response
            
            publish${singularName}(revision: ID!): ${singularName}Response
            
            unpublish${singularName}(revision: ID!): ${singularName}Response
            
            delete${singularName}(revision: ID!, options: CmsDeleteEntryOptions): CmsDeleteResponse
        }
    `;
};
