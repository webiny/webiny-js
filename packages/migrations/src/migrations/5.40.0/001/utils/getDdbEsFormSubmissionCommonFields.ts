import {
    CmsEntry,
    FbSubmission,
    FormSubmissionValues,
    Status
} from "~/migrations/5.40.0/001/types";

export const getDdbEsFormSubmissionCommonFields = (
    submission: FbSubmission
): CmsEntry<FormSubmissionValues> => {
    return {
        entryId: submission.id,
        id: `${submission.id}#0001`,
        locale: submission.locale,
        locked: false,
        location: {
            folderId: "root"
        },
        modelId: "fbSubmission",
        status: Status.DRAFT,
        tenant: submission.tenant,
        webinyVersion: submission.webinyVersion,
        version: 1,
        values: {
            "json@data": submission.data,
            "json@logs": submission.logs ?? [],
            "object@form": {
                "object@fields": submission.form.fields.map(field => ({
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
                "object@steps": submission.form.steps.map(step => ({
                    "json@layout": step.layout,
                    "text@title": step.title
                })),
                "text@id": submission.form.id,
                "text@name": submission.form.name,
                "text@parent": submission.form.parent,
                "text@version": submission.form.version
            },
            "object@meta": {
                "text@ip": submission.meta.ip,
                "datetime@submittedOn": submission.meta.submittedOn,
                "object@url": {
                    "json@query": submission.meta.url.query,
                    "text@location": submission.meta.url.location
                }
            }
        }
    };
};
