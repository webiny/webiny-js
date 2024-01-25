import { CmsEntry, FbForm, FormEntryValues } from "../types";

export const getFormCommonFields = (form: FbForm): CmsEntry<FormEntryValues> => {
    return {
        entryId: form.formId,
        id: form.id,
        locked: form.locked,
        locale: form.locale,
        location: {
            folderId: "root"
        },
        modelId: "fbForm",
        status: form.status,
        tenant: form.tenant,
        version: form.version,
        webinyVersion: String(process.env.WEBINY_VERSION),
        meta: {},
        values: {
            "json@triggers": form.triggers ?? null,
            "object@fields": form.fields.map(field => ({
                "json@settings": field.settings,
                "object@options": field.options.map(option => ({
                    "text@label": option.label,
                    "text@value": option.value
                })),
                "object@validation": field.validation.map(v => ({
                    "text@message": v.message,
                    "text@name": v.name,
                    "json@settings": v.settings
                })),
                "text@fieldId": field.fieldId,
                "text@helpText": field.helpText ?? null,
                "text@label": field.label,
                "text@name": field.name,
                "text@placeholderText": field.placeholderText ?? null,
                "text@type": field.type,
                "text@_id": field._id
            })),
            "object@settings": {
                "boolean@fullWidthSubmitButton": form.settings.fullWidthSubmitButton,
                "json@successMessage": form.settings.successMessage,
                "text@submitButtonLabel": form.settings.submitButtonLabel,
                "object@layout": {
                    "text@renderer": form.settings.layout?.renderer || null
                },
                "object@reCaptcha": {
                    "boolean@enabled": form.settings.reCaptcha.enabled,
                    "text@errorMessage": form.settings.reCaptcha.errorMessage
                },
                ...(form.settings.termsOfServiceMessage && {
                    "object@termsOfServiceMessage": {
                        "boolean@enabled": form.settings.termsOfServiceMessage.enabled,
                        "json@message": form.settings.termsOfServiceMessage.message,
                        "text@errorMessage": form.settings.termsOfServiceMessage.errorMessage
                    }
                })
            },
            "object@steps": form.steps.map(step => ({
                "json@layout": step.layout,
                "text@title": step.title
            })),
            "text@formId": form.formId,
            "text@name": form.name,
            "text@slug": form.slug
        }
    };
};
