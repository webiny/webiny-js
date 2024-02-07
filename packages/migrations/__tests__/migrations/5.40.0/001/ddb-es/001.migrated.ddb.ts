import { createFormsData, user } from "./001.ddb";
import { Status } from "~/migrations/5.40.0/001/types";

export const migratedDdbFormData = [
    {
        PK: "T#root#L#en-US#CMS#CME#65c0a07038a36e00082095ea",
        SK: "L",
        createdBy: user,
        createdOn: "2024-02-05T08:46:40.354Z",
        entryId: "65c0a07038a36e00082095ea",
        firstPublishedBy: user,
        firstPublishedOn: "2024-02-05T08:47:01.134Z",
        id: "65c0a07038a36e00082095ea#0001",
        lastPublishedBy: user,
        lastPublishedOn: "2024-02-05T08:47:01.134Z",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: true,
        meta: {},
        modelId: "fbForm",
        modifiedBy: user,
        modifiedOn: "2024-02-05T08:47:01.134Z",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-02-05T08:46:40.354Z",
        revisionFirstPublishedBy: user,
        revisionFirstPublishedOn: "2024-02-05T08:47:01.134Z",
        revisionLastPublishedBy: user,
        revisionLastPublishedOn: "2024-02-05T08:47:01.134Z",
        revisionModifiedBy: user,
        revisionModifiedOn: "2024-02-05T08:47:01.134Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-02-05T08:47:01.134Z",
        savedBy: user,
        savedOn: "2024-02-05T08:47:01.134Z",
        status: "published",
        tenant: "root",
        values: {
            "json@triggers": null,
            "object@fields": [
                {
                    "object@options": [],
                    "text@helpText": null,
                    "text@placeholderText": null,
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@validation": [],
                    "text@fieldId": "demoField",
                    "text@label": "Demo field",
                    "text@name": "text",
                    "text@type": "text",
                    "text@_id": "fi0rrnUHdl"
                }
            ],
            "object@settings": {
                "boolean@fullWidthSubmitButton": null,
                "json@successMessage": null,
                "object@layout": {
                    "text@renderer": "default"
                },
                "object@reCaptcha": {
                    "boolean@enabled": null,
                    "text@errorMessage": "Please verify that you are not a robot."
                },
                "text@submitButtonLabel": null
            },
            "object@steps": [
                {
                    "json@layout": [["fi0rrnUHdl"]],
                    "text@title": "Step 1"
                }
            ],
            "text@formId": "65c0a07038a36e00082095ea",
            "text@name": "Demo form 1",
            "text@slug": "demo-form-1-65c0a07038a36e00082095ea"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#65c0a07038a36e00082095ea",
        SK: "P",
        createdBy: user,
        createdOn: "2024-02-05T08:46:40.354Z",
        entryId: "65c0a07038a36e00082095ea",
        firstPublishedBy: user,
        firstPublishedOn: "2024-02-05T08:47:01.134Z",
        id: "65c0a07038a36e00082095ea#0001",
        lastPublishedBy: user,
        lastPublishedOn: "2024-02-05T08:47:01.134Z",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: true,
        meta: {},
        modelId: "fbForm",
        modifiedBy: user,
        modifiedOn: "2024-02-05T08:47:01.134Z",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-02-05T08:46:40.354Z",
        revisionFirstPublishedBy: user,
        revisionFirstPublishedOn: "2024-02-05T08:47:01.134Z",
        revisionLastPublishedBy: user,
        revisionLastPublishedOn: "2024-02-05T08:47:01.134Z",
        revisionModifiedBy: user,
        revisionModifiedOn: "2024-02-05T08:47:01.134Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-02-05T08:47:01.134Z",
        savedBy: user,
        savedOn: "2024-02-05T08:47:01.134Z",
        status: "published",
        tenant: "root",
        TYPE: "cms.entry.p",
        values: {
            "json@triggers": null,
            "object@fields": [
                {
                    "object@options": [],
                    "text@helpText": null,
                    "text@placeholderText": null,
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@validation": [],
                    "text@fieldId": "demoField",
                    "text@label": "Demo field",
                    "text@name": "text",
                    "text@type": "text",
                    "text@_id": "fi0rrnUHdl"
                }
            ],
            "object@settings": {
                "boolean@fullWidthSubmitButton": null,
                "json@successMessage": null,
                "object@layout": {
                    "text@renderer": "default"
                },
                "object@reCaptcha": {
                    "boolean@enabled": null,
                    "text@errorMessage": "Please verify that you are not a robot."
                },
                "text@submitButtonLabel": null
            },
            "object@steps": [
                {
                    "json@layout": [["fi0rrnUHdl"]],
                    "text@title": "Step 1"
                }
            ],
            "text@formId": "65c0a07038a36e00082095ea",
            "text@name": "Demo form 1",
            "text@slug": "demo-form-1-65c0a07038a36e00082095ea"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#65c0a07038a36e00082095ea",
        SK: "REV#0001",
        createdBy: user,
        createdOn: "2024-02-05T08:46:40.354Z",
        entryId: "65c0a07038a36e00082095ea",
        firstPublishedBy: user,
        firstPublishedOn: "2024-02-05T08:47:01.134Z",
        id: "65c0a07038a36e00082095ea#0001",
        lastPublishedBy: user,
        lastPublishedOn: "2024-02-05T08:47:01.134Z",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: true,
        meta: {},
        modelId: "fbForm",
        modifiedBy: user,
        modifiedOn: "2024-02-05T08:47:01.134Z",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-02-05T08:46:40.354Z",
        revisionFirstPublishedBy: user,
        revisionFirstPublishedOn: "2024-02-05T08:47:01.134Z",
        revisionLastPublishedBy: user,
        revisionLastPublishedOn: "2024-02-05T08:47:01.134Z",
        revisionModifiedBy: user,
        revisionModifiedOn: "2024-02-05T08:47:01.134Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-02-05T08:47:01.134Z",
        savedBy: user,
        savedOn: "2024-02-05T08:47:01.134Z",
        status: "published",
        tenant: "root",
        TYPE: "cms.entry",
        values: {
            "json@triggers": null,
            "object@fields": [
                {
                    "object@options": [],
                    "text@helpText": null,
                    "text@placeholderText": null,
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@validation": [],
                    "text@fieldId": "demoField",
                    "text@label": "Demo field",
                    "text@name": "text",
                    "text@type": "text",
                    "text@_id": "fi0rrnUHdl"
                }
            ],
            "object@settings": {
                "boolean@fullWidthSubmitButton": null,
                "json@successMessage": null,
                "object@layout": {
                    "text@renderer": "default"
                },
                "object@reCaptcha": {
                    "boolean@enabled": null,
                    "text@errorMessage": "Please verify that you are not a robot."
                },
                "text@submitButtonLabel": null
            },
            "object@steps": [
                {
                    "json@layout": [["fi0rrnUHdl"]],
                    "text@title": "Step 1"
                }
            ],
            "text@formId": "65c0a07038a36e00082095ea",
            "text@name": "Demo form 1",
            "text@slug": "demo-form-1-65c0a07038a36e00082095ea"
        },
        version: 1,
        webinyVersion: "0.0.0"
    }
];

export const migratedFormStatsData = [
    {
        PK: "T#root#L#en-US#CMS#CME#65c0a07038a36e00082095ea-0001-stats",
        SK: "L",
        createdBy: user,
        createdOn: "2024-02-05T08:46:40.354Z",
        entryId: "65c0a07038a36e00082095ea-0001-stats",
        id: "65c0a07038a36e00082095ea-0001-stats#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fbFormStat",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-02-05T08:46:40.354Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-02-05T08:47:01.134Z",
        savedBy: user,
        savedOn: "2024-02-05T08:47:01.134Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry.l",
        values: {
            "number@formVersion": 1,
            "number@submissions": 5000,
            "number@views": 10000,
            "text@formId": "65c0a07038a36e00082095ea"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#65c0a07038a36e00082095ea-0001-stats",
        SK: "REV#0001",
        createdBy: user,
        createdOn: "2024-02-05T08:46:40.354Z",
        entryId: "65c0a07038a36e00082095ea-0001-stats",
        id: "65c0a07038a36e00082095ea-0001-stats#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fbFormStat",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-02-05T08:46:40.354Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-02-05T08:47:01.134Z",
        savedBy: user,
        savedOn: "2024-02-05T08:47:01.134Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry",
        values: {
            "number@formVersion": 1,
            "number@submissions": 5000,
            "number@views": 10000,
            "text@formId": "65c0a07038a36e00082095ea"
        },
        version: 1,
        webinyVersion: "0.0.0"
    }
];

export const createMigratedFormSubmissionsData = () => {
    const forms = createFormsData().filter(
        form => form.TYPE === "fb.form" && form.stats.submissions > 0
    );

    const submissions = [];

    for (const form of forms) {
        for (let i = 0; i < form.stats.submissions; i++) {
            const commonFields = {
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
                                "text@label": "", //option.label,
                                "text@value": "" // option.value
                            })),
                            "object@validation": field.validation.map(v => ({
                                "text@message": "", // v.message,
                                "text@name": "", // v.name,
                                "json@settings": "" // v.settings
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
                createdOn: form.createdOn,
                createdBy: form.createdBy,
                savedBy: form.createdBy,
                savedOn: form.savedOn,
                revisionCreatedBy: form.createdBy,
                revisionCreatedOn: form.createdOn,
                revisionSavedBy: form.createdBy,
                revisionSavedOn: form.savedOn
            };

            const revision = {
                PK: `T#${form.tenant}#L#${form.locale}#CMS#CME#${form.id}-submission-${i}`,
                SK: "REV#0001",
                TYPE: "cms.entry",
                ...commonFields
            };

            submissions.push(revision);

            const latest = {
                PK: `T#${form.tenant}#L#${form.locale}#CMS#CME#${form.id}-submission-${i}`,
                SK: "L",
                TYPE: "cms.entry.l",
                ...commonFields
            };

            submissions.push(latest);
        }
    }

    return submissions;
};
