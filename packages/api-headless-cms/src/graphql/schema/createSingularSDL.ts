import { ApiEndpoint, CmsFieldTypePlugins, CmsModel } from "~/types";
import { renderInputFields } from "~/utils/renderInputFields";
import { renderFields } from "~/utils/renderFields";
import { ENTRY_META_FIELDS, isDateTimeEntryMetaField } from "~/constants";

interface CreateSingularSDLParams {
    models: CmsModel[];
    model: CmsModel;
    fieldTypePlugins: CmsFieldTypePlugins;
    type: ApiEndpoint;
}

interface CreateSingularSDL {
    (params: CreateSingularSDLParams): string;
}

export const createSingularSDL: CreateSingularSDL = ({
    models,
    model,
    fieldTypePlugins,
    type
}): string => {
    const inputFields = renderInputFields({
        models,
        model,
        fields: model.fields,
        fieldTypePlugins
    });
    if (inputFields.length === 0) {
        return "";
    }

    const fields = renderFields({
        models,
        model,
        fields: model.fields,
        type,
        fieldTypePlugins
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

    // Had to remove /* GraphQL */ because prettier would not format the code correctly.
    const read = `
        """${model.description || singularName}"""
        type ${singularName} {
            id: ID!
            entryId: String!
            
            ${onByMetaGqlFields}

            ownedBy: CmsIdentity @deprecated(reason: "Field was removed with the 5.39.0 release. Use 'createdBy' field.")
            
            ${fields.map(f => f.fields).join("\n")}
        }

        ${fields.map(f => f.typeDefs).join("\n")}
        
        input ${singularName}ListWhereInput {
            id: String
        }

        type ${singularName}Response {
            data: ${singularName}
            error: CmsError
        }
        
        extend type Query {
            get${singularName}: ${singularName}Response
        }

    `;
    if (type !== "manage") {
        return read;
    }
    return `
        ${read}
    
        ${inputFields.map(f => f.typeDefs).join("\n")}
        
        input ${singularName}Input {
            ${onByMetaInputGqlFields}
            ${inputGqlFields}
        }
    
        extend type Mutation {
            update${singularName}(data: ${singularName}Input!, options: UpdateCmsEntryOptionsInput): ${singularName}Response
        }
    `;
};
