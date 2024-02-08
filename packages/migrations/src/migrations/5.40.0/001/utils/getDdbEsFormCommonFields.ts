import { CmsEntryDdbEs, FbForm, FormEntryDdbEsRawValues, FormEntryDdbEsValues } from "../types";

export const getDdbEsFormCommonFields = (
    form: FbForm
): CmsEntryDdbEs<FormEntryDdbEsValues, FormEntryDdbEsRawValues> => {
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
            "text@formId": form.formId,
            "text@name": form.name,
            "text@slug": form.slug,
            "object@fields": form.fields.map(field => ({
                "object@options": field.options.map(option => ({
                    "text@label": option.label,
                    "text@value": option.value
                })),
                "object@validation": field.validation.map(validation => ({
                    "text@message": validation.message,
                    "text@name": validation.name
                })),
                "text@_id": field._id,
                "text@fieldId": field.fieldId,
                "text@type": field.type,
                "text@name": field.name,
                "text@label": field.label,
                "text@helpText": field.helpText ?? null,
                "text@placeholderText": field.placeholderText ?? null
            })),
            "object@steps": form.steps.map(step => ({
                "text@title": step.title
            })),
            "object@settings": {
                "object@layout": {
                    "text@renderer": form.settings.layout?.renderer || null
                },
                "text@submitButtonLabel": form.settings.submitButtonLabel,
                "boolean@fullWidthSubmitButton": form.settings.fullWidthSubmitButton,
                "object@reCaptcha": {
                    "boolean@enabled": form.settings.reCaptcha.enabled,
                    "text@errorMessage": form.settings.reCaptcha.errorMessage
                },
                ...(form.settings.termsOfServiceMessage && {
                    "object@termsOfServiceMessage": {
                        "boolean@enabled": form.settings.termsOfServiceMessage.enabled,
                        "text@errorMessage": form.settings.termsOfServiceMessage.errorMessage
                    }
                })
            }
        },
        rawValues: {
            "object@fields": form.fields.map(field => ({
                "json@settings": field.settings,
                "object@validation": field.validation.map(validation => ({
                    "json@settings": validation.settings
                }))
            })),
            "object@steps": form.steps.map(step => ({
                "json@layout": step.layout
            })),
            "object@settings": {
                "object@layout": {},
                "object@reCaptcha": {},
                "json@successMessage": form.settings.successMessage,
                ...(form.settings.termsOfServiceMessage && {
                    "object@termsOfServiceMessage": {
                        "json@message": form.settings.termsOfServiceMessage.message
                    }
                })
            },
            "json@triggers": form.triggers ?? null
        }
    };
};
