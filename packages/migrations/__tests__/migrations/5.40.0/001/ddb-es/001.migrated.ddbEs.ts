// Note that the data is decompressed.

import { user } from "~tests/migrations/5.40.0/001/ddb-es/001.ddb";

export const migratedDdbEsData = [
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
    },
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
                "number@submissions": 1000
            },
            location: { folderId: "root" },
            rawValues: {},
            latest: true,
            TYPE: "cms.entry.l",
            __type: "cms.entry.l"
        }
    }
];
