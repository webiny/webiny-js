import { createFormsData, user } from "./001.ddb";
import { Status } from "~/migrations/5.40.0/001/types";

// Note that the data is decompressed.
const migratedDdbEsFormData = [
    {
        PK: "T#root#L#en-US#CMS#CME#65c0a07038a36e00082095ea",
        SK: "L",
        data: {
            modelId: "fbForm",
            revisionCreatedOn: "2024-02-05T08:46:40.354Z",
            status: "published",
            revisionCreatedBy: user,
            createdBy: user,
            entryId: "65c0a07038a36e00082095ea",
            id: "65c0a07038a36e00082095ea#0001",
            savedBy: user,
            version: 1,
            location: { folderId: "root" },
            revisionSavedOn: "2024-02-05T08:47:01.134Z",
            locale: "en-US",
            savedOn: "2024-02-05T08:47:01.134Z",
            values: {
                "text@formId": "65c0a07038a36e00082095ea",
                "text@name": "Demo form 1",
                "object@fields": [
                    {
                        "text@_id": "fi0rrnUHdl",
                        "text@fieldId": "demoField",
                        "text@type": "text",
                        "text@name": "text",
                        "text@label": "Demo field",
                        "object@options": [],
                        "object@validation": [],
                        "text@helpText": null,
                        "text@placeholderText": null
                    }
                ],
                "object@steps": [{ "text@title": "Step 1" }],
                "object@settings": {
                    "object@layout": { "text@renderer": "default" },
                    "text@submitButtonLabel": null,
                    "boolean@fullWidthSubmitButton": null,
                    "object@reCaptcha": {
                        "boolean@enabled": null,
                        "text@errorMessage": "Please verify that you are not a robot."
                    }
                },
                "text@slug": "demo-form-1-65c0a07038a36e00082095ea"
            },
            revisionSavedBy: user,
            tenant: "root",
            createdOn: "2024-02-05T08:46:40.354Z",
            locked: true,
            webinyVersion: "0.0.0",
            revisionModifiedOn: "2024-02-05T08:47:01.134Z",
            revisionFirstPublishedOn: "2024-02-05T08:47:01.134Z",
            revisionLastPublishedOn: "2024-02-05T08:47:01.134Z",
            revisionModifiedBy: user,
            revisionFirstPublishedBy: user,
            revisionLastPublishedBy: user,
            modifiedOn: "2024-02-05T08:47:01.134Z",
            firstPublishedOn: "2024-02-05T08:47:01.134Z",
            lastPublishedOn: "2024-02-05T08:47:01.134Z",
            modifiedBy: user,
            firstPublishedBy: user,
            lastPublishedBy: user,
            meta: {},
            rawValues: {
                "object@fields": [{ "json@settings": { defaultValue: null } }],
                "object@steps": [{ "json@layout": [["fi0rrnUHdl"]] }],
                "object@settings": {
                    "object@layout": {},
                    "json@successMessage": null,
                    "object@reCaptcha": {}
                },
                "json@triggers": null
            },
            latest: true,
            TYPE: "cms.entry.l",
            __type: "cms.entry.l"
        }
    },
    {
        PK: "T#root#L#en-US#CMS#CME#65c0a07038a36e00082095ea",
        SK: "P",
        data: {
            modelId: "fbForm",
            revisionCreatedOn: "2024-02-05T08:46:40.354Z",
            status: "published",
            meta: {},
            revisionCreatedBy: user,
            revisionModifiedBy: user,
            createdBy: user,
            entryId: "65c0a07038a36e00082095ea",
            id: "65c0a07038a36e00082095ea#0001",
            savedBy: user,
            version: 1,
            location: { folderId: "root" },
            revisionSavedOn: "2024-02-05T08:47:01.134Z",
            locale: "en-US",
            savedOn: "2024-02-05T08:47:01.134Z",
            values: {
                "text@formId": "65c0a07038a36e00082095ea",
                "text@name": "Demo form 1",
                "object@fields": [
                    {
                        "text@_id": "fi0rrnUHdl",
                        "text@fieldId": "demoField",
                        "text@type": "text",
                        "text@name": "text",
                        "text@label": "Demo field",
                        "object@options": [],
                        "object@validation": [],
                        "text@helpText": null,
                        "text@placeholderText": null
                    }
                ],
                "object@steps": [{ "text@title": "Step 1" }],
                "object@settings": {
                    "object@layout": { "text@renderer": "default" },
                    "text@submitButtonLabel": null,
                    "boolean@fullWidthSubmitButton": null,
                    "object@reCaptcha": {
                        "boolean@enabled": null,
                        "text@errorMessage": "Please verify that you are not a robot."
                    }
                },
                "text@slug": "demo-form-1-65c0a07038a36e00082095ea"
            },
            revisionSavedBy: user,
            tenant: "root",
            revisionModifiedOn: "2024-02-05T08:47:01.134Z",
            createdOn: "2024-02-05T08:46:40.354Z",
            modifiedOn: "2024-02-05T08:47:01.134Z",
            locked: true,
            webinyVersion: "0.0.0",
            modifiedBy: user,
            firstPublishedOn: "2024-02-05T08:47:01.134Z",
            lastPublishedOn: "2024-02-05T08:47:01.134Z",
            firstPublishedBy: user,
            lastPublishedBy: user,
            revisionFirstPublishedOn: "2024-02-05T08:47:01.134Z",
            revisionLastPublishedOn: "2024-02-05T08:47:01.134Z",
            revisionFirstPublishedBy: user,
            revisionLastPublishedBy: user,
            rawValues: {
                "object@fields": [{ "json@settings": { defaultValue: null } }],
                "object@steps": [{ "json@layout": [["fi0rrnUHdl"]] }],
                "object@settings": {
                    "object@layout": {},
                    "json@successMessage": null,
                    "object@reCaptcha": {}
                },
                "json@triggers": null
            },
            published: true,
            TYPE: "cms.entry.p",
            __type: "cms.entry.p"
        }
    }
];

const getMigratedDdbEsFormStatsData = () => {
    const forms = createFormsData().filter(form => form.TYPE === "fb.form");

    return forms.map(form => {
        const [formId, revisionId] = form.id.split("#");

        return {
            PK: `T#${form.tenant}#L#${form.locale}#CMS#CME#${form.formId}-0001-stats`,
            SK: "L",
            data: {
                webinyVersion: form.webinyVersion,
                tenant: form.tenant,
                entryId: `${formId}-${revisionId}-stats`,
                id: `${formId}-${revisionId}-stats#0001`,
                modelId: "fbFormStat",
                locale: form.locale,
                createdOn: form.createdOn,
                savedOn: form.savedOn,
                createdBy: user,
                savedBy: user,
                revisionCreatedOn: form.createdOn,
                revisionSavedOn: form.savedOn,
                revisionCreatedBy: user,
                revisionSavedBy: user,
                version: form.version,
                status: "draft",
                locked: false,
                values: {
                    "text@formId": form.formId,
                    "number@formVersion": form.version,
                    "number@views": form.stats.views,
                    "number@submissions": form.stats.submissions
                },
                location: { folderId: "root" },
                rawValues: {},
                latest: true,
                TYPE: "cms.entry.l",
                __type: "cms.entry.l"
            }
        };
    });
};

const migratedDdbEsFormStatsData = [
    {
        PK: "T#root#L#en-US#CMS#CME#65c0a07038a36e00082095ea-0001-stats",
        SK: "L",
        data: {
            webinyVersion: "0.0.0",
            tenant: "root",
            entryId: "65c0a07038a36e00082095ea-0001-stats",
            id: "65c0a07038a36e00082095ea-0001-stats#0001",
            modelId: "fbFormStat",
            locale: "en-US",
            createdOn: "2024-02-05T08:46:40.354Z",
            savedOn: "2024-02-05T08:47:01.134Z",
            createdBy: user,
            savedBy: user,
            revisionCreatedOn: "2024-02-05T08:46:40.354Z",
            revisionSavedOn: "2024-02-05T08:47:01.134Z",
            revisionCreatedBy: user,
            revisionSavedBy: user,
            version: 1,
            status: "draft",
            locked: false,
            values: {
                "text@formId": "65c0a07038a36e00082095ea",
                "number@formVersion": 1,
                "number@views": 10000,
                "number@submissions": 5000
            },
            location: { folderId: "root" },
            rawValues: {},
            latest: true,
            TYPE: "cms.entry.l",
            __type: "cms.entry.l"
        }
    }
];

const createMigratedDdbEsFormSubmissionsData = () => {
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
                                    "text@label": "", //option.label,
                                    "text@value": "" //option.value
                                })),
                                "object@validation": field.validation.map(v => ({
                                    "text@message": "", // v.message,
                                    "text@name": "", //v.name,
                                    "json@settings": "" //v.settings
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

export const createMigratedDdbEsData = () => {
    const migratedDdbEsFormSubmissionsData = createMigratedDdbEsFormSubmissionsData();
    const migratedDdbEsFormStatsData = getMigratedDdbEsFormStatsData();

    return [
        ...migratedDdbEsFormData,
        ...migratedDdbEsFormStatsData,
        ...migratedDdbEsFormSubmissionsData
    ];
};
