import { CmsPrivateModelFull } from "@webiny/api-headless-cms";
import { CmsModelField, CmsModelGroup } from "@webiny/api-headless-cms/types";

import { createModelField } from "../createModelField";

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

const field_IdField = () => {
    return createModelField({
        label: "ID",
        fieldId: "_id",
        type: "text",
        validation: [required()]
    });
};

const fieldIdField = () => {
    return createModelField({
        label: "FieldId",
        type: "text",
        validation: [required()]
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
        type: "text"
    });
};

const fieldValidationSettingsField = () => {
    return createModelField({
        label: "Settings",
        type: "json"
    });
};

const fieldValidationField = (fields: CmsModelField[]) => {
    return createModelField({
        label: "Validation",
        type: "object",
        multipleValues: true,
        settings: {
            fields
        }
    });
};

const fieldSettingsField = () => {
    return createModelField({
        label: "Settings",
        type: "json"
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
        type: "boolean"
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
        type: "boolean"
    });
};

const settingsSuccessMessageField = () => {
    return createModelField({
        label: "SuccessMessage",
        type: "json"
    });
};

const settingsTermsOfServiceMessageEnabledField = () => {
    return createModelField({
        label: "Enabled",
        fieldId: "enabled",
        type: "boolean"
    });
};

const settingsTermsOfServiceMessageMessageField = () => {
    return createModelField({
        label: "Message",
        fieldId: "message",
        type: "json"
    });
};

const settingsTermsOfServiceMessageErrorMessageField = () => {
    return createModelField({
        label: "Error Message",
        fieldId: "errorMessage",
        type: "text"
    });
};

const settingsTermsOfServiceMessageField = (fields: CmsModelField[]) => {
    return createModelField({
        label: "TermsOfServiceMessage",
        type: "object",
        settings: {
            fields
        }
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

const triggersField = () => {
    return createModelField({
        label: "Triggers",
        type: "json"
    });
};

const slugField = () => {
    return createModelField({
        label: "Slug",
        fieldId: "slug",
        type: "text"
    });
};

const SETTINGS_FIELDS: CmsModelField[] = [
    settingsLayoutField([settingsLayoutRendererField()]),
    settingsSubmitButtonLabelField(),
    settingsFullWidthSubmitButtonField(),
    settingsSuccessMessageField(),
    settingsTermsOfServiceMessageField([
        settingsTermsOfServiceMessageEnabledField(),
        settingsTermsOfServiceMessageMessageField(),
        settingsTermsOfServiceMessageErrorMessageField()
    ]),
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
        fieldValidationSettingsField()
    ]),
    fieldSettingsField()
];

export const STEP_FIELDS = [stepTitleField(), stepLayoutField()];

export const createFormDataModelDefinition = (group: CmsModelGroup): CmsPrivateModelFull => {
    return {
        name: "FbForm",
        modelId: "fbForm",
        titleFieldId: "name",
        fields: [
            formIdField(),
            nameField(),
            fieldsField(FIELD_FIELDS),
            stepsField(STEP_FIELDS),
            settingsField(SETTINGS_FIELDS),
            triggersField(),
            slugField()
        ],
        isPrivate: true,
        group,
        noValidate: true
    };
};
