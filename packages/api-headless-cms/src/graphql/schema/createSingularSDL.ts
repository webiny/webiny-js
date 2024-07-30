import { CmsFieldTypePlugins, CmsModel } from "~/types";
import { renderInputFields } from "~/utils/renderInputFields";
import { renderFields } from "~/utils/renderFields";
import { ENTRY_META_FIELDS, isDateTimeEntryMetaField } from "~/constants";

interface CreateSingularSDLParams {
    models: CmsModel[];
    model: CmsModel;
    fieldTypePlugins: CmsFieldTypePlugins;
}

interface CreateSingularSDL {
    (params: CreateSingularSDLParams): string;
}

export const createSingularSDL: CreateSingularSDL = ({
    models,
    model,
    fieldTypePlugins
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
        type: "manage",
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
    return `
        """${model.description || singularName}"""
        type ${singularName} {
            id: ID!
            entryId: String!
            
            ${onByMetaGqlFields}
            
            publishedOn: DateTime @deprecated(reason: "Field was removed with the 5.39.0 release. Use 'firstPublishedOn' or 'lastPublishedOn' field.")
            ownedBy: CmsIdentity @deprecated(reason: "Field was removed with the 5.39.0 release. Use 'createdBy' field.")
            
            ${fields.map(f => f.fields).join("\n")}
            # Advanced Content Organization - make required in 5.38.0
            wbyAco_location: WbyAcoLocation
        }

        ${fields.map(f => f.typeDefs).join("\n")}

        ${inputFields.map(f => f.typeDefs).join("\n")}
        
        input ${singularName}Input {
            # Set status of the entry.
            status: String
            
            ${onByMetaInputGqlFields}
            
            wbyAco_location: WbyAcoLocationInput
            
            ${inputGqlFields}
        }

        type ${singularName}Response {
            data: ${singularName}
            error: CmsError
        }
        
        extend type Query {
            get${singularName}(revision: ID, entryId: ID, status: CmsEntryStatusType): ${singularName}Response
        }

        extend type Mutation {
            update${singularName}(data: ${singularName}Input!, options: UpdateCmsEntryOptionsInput): ${singularName}Response
        }
    `;
};
