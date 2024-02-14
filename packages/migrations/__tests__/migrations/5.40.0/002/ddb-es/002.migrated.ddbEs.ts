import { createFormsData } from "./002.ddb";
import { Status } from "~/migrations/5.40.0/002/types";

// Note that the data is decompressed.
export const createMigratedDdbEsFormSubmissionsData = () => {
    const forms = createFormsData().filter(
        form => form.TYPE === "fb.form" && form.stats.submissions > 0
    );

    const submissions = [];

    for (const form of forms) {
        for (let i = 0; i < form.stats.submissions; i++) {
            const latest = {
                PK: `T#${form.tenant}#L#${form.locale}#CMS#CME#${form.id}-submission-${i}`,
                SK: "L",
                data: {
                    entryId: `${form.id}-submission-${i}`,
                    id: `${form.id}-submission-${i}#0001`,
                    locale: form.locale,
                    locked: false,
                    location: {
                        folderId: "root"
                    },
                    modelId: "fbSubmission",
                    status: Status.DRAFT,
                    tenant: form.tenant,
                    webinyVersion: form.webinyVersion,
                    version: 1,
                    values: {
                        "json@data": form.fields.map(field => ({
                            [field.fieldId]: `${field.label} submission ${i}`
                        })),
                        "json@logs": [
                            {
                                type: "info",
                                message: "Form submission created."
                            },
                            {
                                type: "success",
                                message: "Form submitted successfully."
                            }
                        ],
                        "object@form": {
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
                                "text@helpText": field.helpText,
                                "text@label": field.label,
                                "text@name": field.name,
                                "text@placeholderText": field.placeholderText,
                                "text@type": field.type,
                                "text@_id": field._id
                            })),
                            "object@steps": form.steps.map(step => ({
                                "json@layout": step.layout,
                                "text@title": step.title
                            })),
                            "text@id": form.id,
                            "text@name": form.name,
                            "text@parent": form.formId,
                            "text@version": form.version
                        },
                        "object@meta": {
                            "text@ip": "0.0.0.0",
                            "datetime@submittedOn": form.createdOn,
                            "object@url": {
                                "json@query": {
                                    formId: form.formId,
                                    tenant: form.tenant,
                                    locale: form.locale
                                },
                                "text@location": `https://${form.formId}.website.com/any`
                            }
                        }
                    },
                    createdBy: form.createdBy,
                    createdOn: form.createdOn,
                    savedBy: form.ownedBy,
                    savedOn: form.savedOn,
                    revisionCreatedBy: form.createdBy,
                    revisionCreatedOn: form.createdOn,
                    revisionSavedOn: form.savedOn,
                    revisionSavedBy: form.ownedBy,
                    latest: true,
                    TYPE: "cms.entry.l",
                    __type: "cms.entry.l"
                }
            };

            submissions.push(latest);
        }
    }

    return submissions;
};
