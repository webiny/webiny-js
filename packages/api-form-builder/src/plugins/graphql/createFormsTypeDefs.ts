import { CmsFieldTypePlugins, CmsModel, CmsModelField } from "@webiny/api-headless-cms/types";
import { renderFields } from "@webiny/api-headless-cms/utils/renderFields";
import { renderInputFields } from "@webiny/api-headless-cms/utils/renderInputFields";

export interface CreateFormsTypeDefsParams {
    model: CmsModel;
    models: CmsModel[];
    plugins: CmsFieldTypePlugins;
}

const removeFieldRequiredValidation = (field: CmsModelField) => {
    if (field.validation) {
        field.validation = field.validation.filter(validation => validation.name !== "required");
    }
    if (field.listValidation) {
        field.listValidation = field.listValidation.filter(v => v.name !== "required");
    }
    return field;
};

const createUpdateFields = (fields: CmsModelField[]): CmsModelField[] => {
    return fields.reduce<CmsModelField[]>((collection, field) => {
        collection.push(removeFieldRequiredValidation({ ...field }));
        return collection;
    }, []);
};

export const createFormsTypeDefs = (params: CreateFormsTypeDefsParams): string => {
    const { model, models, plugins: fieldTypePlugins } = params;
    const { fields } = model;

    const fieldTypes = renderFields({
        models,
        model,
        fields,
        type: "manage",
        fieldTypePlugins
    });

    const inputFields = renderInputFields({
        models,
        model,
        fields,
        fieldTypePlugins
    });

    const excludeFormFields = [
        "formId",
        "stats",
        "overallStats",
        "fields",
        "steps",
        "settings",
        "triggers"
    ];

    const inputCreateFields = renderInputFields({
        models,
        model,
        fields: model.fields.filter(field => !excludeFormFields.includes(field.fieldId)),
        fieldTypePlugins
    });

    const excludeUpdateFormFields = ["formId", "stats", "overallStats"];

    const inputUpdateFields = renderInputFields({
        models,
        model,
        fields: createUpdateFields(
            model.fields.filter(field => !excludeUpdateFormFields.includes(field.fieldId))
        ),
        fieldTypePlugins
    });

    return /* GraphQL */ `
        ${fieldTypes.map(f => f.typeDefs).join("\n")}

        type FbFormUser {
            id: String
            displayName: String
            type: String
        }

        type FbForm {
            id: ID!
            createdBy: FbFormUser!
            createdOn: DateTime!
            savedOn: DateTime!
            publishedOn: DateTime
            status: String!
            version: Number!
            ${fieldTypes.map(f => f.fields).join("\n")}
        }

        ${inputFields.map(f => f.typeDefs).join("\n")}

        input FbCreateFormInput {
            ${inputCreateFields.map(f => f.fields).join("\n")}
        }

        input FbUpdateFormInput {
            ${inputUpdateFields.map(f => f.fields).join("\n")}
        }

        type FbFormResponse {
            data: FbForm
            error: FbError
        }

        type FbFormListResponse {
            data: [FbForm]
            error: FbError
        }

        type FbFormRevisionsResponse {
            data: [FbForm]
            error: FbError
        }

        type FbSaveFormViewResponse {
            error: FbError
        }
        
        
        type FbForm_Settings_ReCaptcha_Settings {
            enabled: Boolean
            secretKey: String
            siteKey: String
        }
        
        extend type FbForm_Settings_ReCaptcha {
            settings: FbForm_Settings_ReCaptcha_Settings
        }
        
        extend input FbForm_Settings_ReCaptchaInput {
            settings: JSON
        }

        extend type FbQuery {
            # Get form (can be published or not, requires authorization )
            getForm(revision: ID!): FbFormResponse

            # List forms (returns a list of latest revision)
            listForms: FbFormListResponse

            # Get form revisions
            getFormRevisions(id: ID!): FbFormRevisionsResponse

            # Get published form form ID (public access)
            getPublishedForm(formId: ID): FbFormResponse
        }

        extend type FbMutation {
            createForm(data: FbCreateFormInput!): FbFormResponse

            # Create a new revision from an existing revision
            createRevisionFrom(revision: ID!): FbFormResponse

            # Update revision
            updateRevision(revision: ID!, data: FbUpdateFormInput!): FbFormResponse

            # Delete form and all of its revisions
            deleteForm(id: ID!): FbDeleteResponse

            # Delete a single revision
            deleteRevision(revision: ID!): FbDeleteResponse

            # Publish revision
            publishRevision(revision: ID!): FbFormResponse

            # Unpublish revision
            unpublishRevision(revision: ID!): FbFormResponse

            # Logs a view of a form
            saveFormView(revision: ID!): FbSaveFormViewResponse
        }
    `;
};
