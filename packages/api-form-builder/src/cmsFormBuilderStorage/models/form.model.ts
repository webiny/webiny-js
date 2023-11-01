import { createModelField } from "../creteModelField";
import { CmsModelField, CmsModelGroup } from "@webiny/api-headless-cms/types";

const required = () => {
    return {
        name: "required",
        message: "Value is required."
    };
};

const formIdField = () => {
    return createModelField({
        label: "Form ID",
        fieldId: "formId",
        type: "text",
        validation: [required()]
    });
};

const nameField = () => {
    return createModelField({
        label: "Name",
        type: "text",
        validation: [required()]
    });
};

const publishedField = () => {
    return createModelField({
        label: "Published",
        type: "text",
        validation: [required()]
    });
};

const statusField = () => {
    return createModelField({
        label: "Status",
        type: "text",
        validation: [required()]
    });
};

const lockedField = () => {
    return createModelField({
        label: "Locked",
        fieldId: "locked",
        type: "text",
        validation: [required()]
    });
};

const field_IdField = () => {
    return createModelField({
        label: "ID",
        fieldId: "_id",
        type: "text"
    });
};

const fieldIdField = () => {
    return createModelField({
        label: "FieldId",
        type: "text"
    });
};

const fieldTypeField = () => {
    return createModelField({
        label: "Type",
        type: "text",
        validation: [required()]
    });
};

const fieldNameField = () => {
    return createModelField({
        label: "Name",
        type: "text",
        validation: [required()]
    });
};

const fieldLabelField = () => {
    return createModelField({
        label: "Label",
        type: "text",
        validation: [required()]
    });
};

const fieldPlaceholderTextField = () => {
    return createModelField({
        label: "PlaceholderText",
        type: "text"
    });
};

const fieldHelpTextField = () => {
    return createModelField({
        label: "HelpText",
        type: "text"
    });
};

const fieldOptionsLabelField = () => {
    return createModelField({
        label: "Label",
        type: "text"
    });
};

const fieldOptionsValueField = () => {
    return createModelField({
        label: "Value",
        type: "text"
    });
};

const fieldOptionsField = (fields: CmsModelField[]) => {
    return createModelField({
        label: "Options",
        type: "object",
        validation: [required()],
        multipleValues: true,
        settings: {
            fields
        }
    });
};

const fieldValidationNameField = () => {
    return createModelField({
        label: "Name",
        type: "text",
        validation: [required()]
    });
};

const fieldValidationMessageField = () => {
    return createModelField({
        label: "Message",
        type: "text",
        validation: [required()]
    });
};

const fieldValidationSettingsValuesField = () => {
    return createModelField({
        label: "Values",
        type: "object",
        multipleValues: true
    });
};

const fieldValidationSettingsValueField = () => {
    return createModelField({
        label: "Value",
        type: "text"
    });
};

const fieldValidationSettingsPresetField = () => {
    return createModelField({
        label: "Preset",
        type: "text"
    });
};

const fieldValidationSettingsField = (fields: CmsModelField[]) => {
    return createModelField({
        label: "Settings",
        type: "object",
        validation: [required()],
        settings: {
            fields
        }
    });
};

const fieldValidationField = (fields: CmsModelField[]) => {
    return createModelField({
        label: "Validation",
        type: "object",
        validation: [required()],
        multipleValues: true,
        settings: {
            fields
        }
    });
};

const fieldSettingsField = () => {
    return createModelField({
        label: "Settings",
        type: "object"
    });
};

export const fieldsField = (fields: CmsModelField[]) => {
    return createModelField({
        label: "Fields",
        type: "object",
        validation: [required()],
        multipleValues: true,
        settings: {
            fields
        }
    });
};

const stepLayoutField = () => {
    return createModelField({
        label: "Layout",
        type: "json",
        validation: [required()],
        multipleValues: true
    });
};

const stepTitleField = () => {
    return createModelField({
        label: "Title",
        type: "text",
        validation: [required()]
    });
};

export const stepsField = (fields: CmsModelField[]) => {
    return createModelField({
        label: "Steps",
        type: "object",
        validation: [required()],
        multipleValues: true,
        settings: {
            fields
        }
    });
};

const settingsReCaptchaEnabledField = () => {
    return createModelField({
        label: "Enabled",
        type: "text"
    });
};

const settingsReCaptchaErrorMessageField = () => {
    return createModelField({
        label: "ErrorMessage",
        type: "text"
    });
};

const settingsReCaptchaField = (fields: CmsModelField[]) => {
    return createModelField({
        label: "reCaptcha",
        type: "object",
        validation: [required()],
        settings: {
            fields
        }
    });
};

const settingsLayoutRendererField = () => {
    return createModelField({
        label: "Renderer",
        type: "text"
    });
};

const settingsLayoutField = (fields: CmsModelField[]) => {
    return createModelField({
        label: "Layout",
        type: "object",
        settings: {
            fields
        }
    });
};

const settingsSubmitButtonLabelField = () => {
    return createModelField({
        label: "SubmitButtonLabel",
        type: "text"
    });
};

const settingsFullWidthSubmitButtonField = () => {
    return createModelField({
        label: "FullWidthSubmitButton",
        type: "text"
    });
};

const settingsSuccessMessageField = () => {
    return createModelField({
        label: "SuccessMessage",
        type: "text"
    });
};

const settingsTermsOfServiceMessageField = () => {
    return createModelField({
        label: "TermsOfServiceMessage",
        type: "text"
    });
};

const settingsField = (fields: CmsModelField[]) => {
    return createModelField({
        label: "Settings",
        type: "object",
        settings: {
            fields
        }
    });
};

const DEFAULT_FIELDS = [
    "formId",
    "name",
    "published",
    "status",
    "locked",
    "fields",
    "steps",
    "settings"
];

const SETTINGS_FIELDS: CmsModelField[] = [
    settingsLayoutField([settingsLayoutRendererField()]),
    settingsSubmitButtonLabelField(),
    settingsFullWidthSubmitButtonField(),
    settingsSuccessMessageField(),
    settingsTermsOfServiceMessageField(),
    settingsReCaptchaField([settingsReCaptchaEnabledField(), settingsReCaptchaErrorMessageField()])
];

export const FIELD_FIELDS = [
    field_IdField(),
    fieldIdField(),
    fieldTypeField(),
    fieldNameField(),
    fieldLabelField(),
    fieldPlaceholderTextField(),
    fieldHelpTextField(),
    fieldOptionsField([fieldOptionsLabelField(), fieldOptionsValueField()]),
    fieldValidationField([
        fieldValidationNameField(),
        fieldValidationMessageField(),
        fieldValidationSettingsField([
            fieldValidationSettingsValuesField(),
            fieldValidationSettingsValueField(),
            fieldValidationSettingsPresetField()
        ])
    ]),
    fieldSettingsField()
];

export const STEP_FIELDS = [stepTitleField(), stepLayoutField()];

export const createFormDataModelDefinition = (group: CmsModelGroup): any => {
    return {
        name: "FbForm",
        modelId: "fbForm",
        titleFieldId: "name",
        layout: DEFAULT_FIELDS.map(field => [field]),
        fields: [
            formIdField(),
            nameField(),
            publishedField(),
            statusField(),
            lockedField(),
            fieldsField(FIELD_FIELDS),
            stepsField(STEP_FIELDS),
            settingsField(SETTINGS_FIELDS)
        ],
        description: "Form Builder - Form builder create data model",
        isPrivate: true,
        group,
        noValidate: true
    };
};
