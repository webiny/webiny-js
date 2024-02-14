import { createFormsData, user } from "./001.ddb";

// Note that the data is decompressed.
const migratedDdbEsFormData = [
    // Form with 1 revision published
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
                "object@fields": [
                    { "json@settings": { defaultValue: null }, "object@validation": [] }
                ],
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
                "object@fields": [
                    { "json@settings": { defaultValue: null }, "object@validation": [] }
                ],
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

    // Form with 2 revisions: 1° published, 2° draft
    {
        PK: "T#root#L#en-US#CMS#CME#65c479873ff56c0008735714",
        SK: "L",
        data: {
            modelId: "fbForm",
            revisionCreatedOn: "2024-02-08T06:50:17.141Z",
            lastPublishedOn: "2024-02-08T06:50:06.306Z",
            status: "draft",
            meta: {},
            revisionCreatedBy: user,
            revisionModifiedBy: user,
            createdBy: user,
            entryId: "65c479873ff56c0008735714",
            lastPublishedBy: user,
            id: "65c479873ff56c0008735714#0002",
            savedBy: user,
            version: 2,
            location: { folderId: "root" },
            firstPublishedBy: user,
            revisionSavedOn: "2024-02-08T06:50:17.141Z",
            locale: "en-US",
            savedOn: "2024-02-08T06:50:17.141Z",
            revisionFirstPublishedBy: null,
            values: {
                "text@formId": "65c479873ff56c0008735714",
                "text@name": "Demo form 2",
                "object@fields": [
                    {
                        "text@_id": "QwlAelzDaq",
                        "text@fieldId": "demoField",
                        "text@type": "text",
                        "text@name": "text",
                        "text@label": "Demo field",
                        "text@placeholderText": null,
                        "text@helpText": null,
                        "object@options": [],
                        "object@validation": []
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
                "text@slug": "demo-form-2-65c479873ff56c0008735714"
            },
            firstPublishedOn: "2024-02-08T06:50:06.306Z",
            revisionSavedBy: user,
            revisionFirstPublishedOn: null,
            tenant: "root",
            revisionModifiedOn: "2024-02-08T06:50:17.141Z",
            revisionLastPublishedBy: null,
            createdOn: "2024-02-08T06:49:43.380Z",
            modifiedOn: "2024-02-08T06:50:17.141Z",
            locked: false,
            webinyVersion: "0.0.0",
            revisionLastPublishedOn: null,
            modifiedBy: user,
            rawValues: {
                "object@fields": [
                    { "json@settings": { defaultValue: null }, "object@validation": [] }
                ],
                "object@steps": [{ "json@layout": [["QwlAelzDaq"]] }],
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
        PK: "T#root#L#en-US#CMS#CME#65c479873ff56c0008735714",
        SK: "P",
        data: {
            modelId: "fbForm",
            revisionCreatedOn: "2024-02-08T06:49:43.380Z",
            status: "published",
            meta: {},
            revisionCreatedBy: user,
            revisionModifiedBy: user,
            createdBy: user,
            entryId: "65c479873ff56c0008735714",
            id: "65c479873ff56c0008735714#0001",
            savedBy: user,
            version: 1,
            location: { folderId: "root" },
            revisionSavedOn: "2024-02-08T06:50:06.306Z",
            locale: "en-US",
            savedOn: "2024-02-08T06:50:06.306Z",
            values: {
                "text@formId": "65c479873ff56c0008735714",
                "text@name": "Demo form 2",
                "object@fields": [
                    {
                        "text@_id": "QwlAelzDaq",
                        "text@fieldId": "demoField",
                        "text@type": "text",
                        "text@name": "text",
                        "text@label": "Demo field",
                        "text@placeholderText": null,
                        "text@helpText": null,
                        "object@options": [],
                        "object@validation": []
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
                "text@slug": "demo-form-2-65c479873ff56c0008735714"
            },
            revisionSavedBy: user,
            tenant: "root",
            revisionModifiedOn: "2024-02-08T06:50:06.306Z",
            createdOn: "2024-02-08T06:49:43.380Z",
            modifiedOn: "2024-02-08T06:50:06.306Z",
            locked: true,
            webinyVersion: "0.0.0",
            modifiedBy: user,
            firstPublishedOn: "2024-02-08T06:50:06.306Z",
            lastPublishedOn: "2024-02-08T06:50:06.306Z",
            firstPublishedBy: user,
            lastPublishedBy: user,
            revisionFirstPublishedOn: "2024-02-08T06:50:06.306Z",
            revisionLastPublishedOn: "2024-02-08T06:50:06.306Z",
            revisionFirstPublishedBy: user,
            revisionLastPublishedBy: user,
            rawValues: {
                "object@fields": [
                    { "json@settings": { defaultValue: null }, "object@validation": [] }
                ],
                "object@steps": [{ "json@layout": [["QwlAelzDaq"]] }],
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

    // Form with 1 draft revision
    {
        PK: "T#root#L#en-US#CMS#CME#65c492e1766cb000084357d1",
        SK: "L",
        data: {
            modelId: "fbForm",
            revisionCreatedOn: "2024-02-08T08:37:53.951Z",
            status: "draft",
            revisionCreatedBy: user,
            createdBy: user,
            entryId: "65c492e1766cb000084357d1",
            id: "65c492e1766cb000084357d1#0001",
            savedBy: user,
            version: 1,
            location: { folderId: "root" },
            revisionSavedOn: "2024-02-08T08:38:06.346Z",
            locale: "en-US",
            savedOn: "2024-02-08T08:38:06.346Z",
            values: {
                "text@formId": "65c492e1766cb000084357d1",
                "text@name": "Demo form 3",
                "object@fields": [
                    {
                        "text@_id": "Ua0cd7oJZD",
                        "text@fieldId": "demoField",
                        "text@type": "text",
                        "text@name": "text",
                        "text@label": "Demo field",
                        "text@placeholderText": null,
                        "text@helpText": null,
                        "object@options": [],
                        "object@validation": []
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
                "text@slug": "demo-form-3-65c492e1766cb000084357d1"
            },
            revisionSavedBy: user,
            tenant: "root",
            createdOn: "2024-02-08T08:37:53.951Z",
            locked: false,
            webinyVersion: "0.0.0",
            revisionModifiedOn: "2024-02-08T08:38:06.346Z",
            revisionFirstPublishedOn: null,
            revisionLastPublishedOn: null,
            revisionModifiedBy: user,
            revisionFirstPublishedBy: null,
            revisionLastPublishedBy: null,
            modifiedOn: "2024-02-08T08:38:06.346Z",
            firstPublishedOn: null,
            lastPublishedOn: null,
            modifiedBy: user,
            firstPublishedBy: null,
            lastPublishedBy: null,
            meta: {},
            rawValues: {
                "object@fields": [
                    { "json@settings": { defaultValue: null }, "object@validation": [] }
                ],
                "object@steps": [{ "json@layout": [["Ua0cd7oJZD"]] }],
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

    // Form with 4 revisions: 1° published, 2° published, 3° unpublished, 4° draft
    {
        PK: "T#root#L#en-US#CMS#CME#65c4994929b99b0008bd6167",
        SK: "L",
        data: {
            modelId: "fbForm",
            revisionCreatedOn: "2024-02-08T09:06:08.967Z",
            lastPublishedOn: "2024-02-08T09:05:41.633Z",
            meta: {},
            status: "draft",
            revisionCreatedBy: user,
            revisionModifiedBy: user,
            createdBy: user,
            entryId: "65c4994929b99b0008bd6167",
            lastPublishedBy: user,
            id: "65c4994929b99b0008bd6167#0004",
            savedBy: user,
            version: 4,
            firstPublishedBy: user,
            location: { folderId: "root" },
            revisionSavedOn: "2024-02-08T09:06:08.967Z",
            locale: "en-US",
            savedOn: "2024-02-08T09:06:08.967Z",
            revisionFirstPublishedBy: null,
            values: {
                "text@formId": "65c4994929b99b0008bd6167",
                "text@name": "Demo form 4",
                "object@fields": [
                    {
                        "text@_id": "h4WRtUvT1t",
                        "text@fieldId": "demoField",
                        "text@type": "text",
                        "text@name": "text",
                        "text@label": "Demo field",
                        "text@placeholderText": null,
                        "text@helpText": null,
                        "object@options": [],
                        "object@validation": []
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
                "text@slug": "demo-form-4-65c4994929b99b0008bd6167"
            },
            firstPublishedOn: "2024-02-08T09:05:41.633Z",
            revisionSavedBy: user,
            revisionFirstPublishedOn: null,
            tenant: "root",
            revisionModifiedOn: "2024-02-08T09:06:08.967Z",
            revisionLastPublishedBy: null,
            createdOn: "2024-02-08T09:05:13.764Z",
            modifiedOn: "2024-02-08T09:06:08.967Z",
            locked: false,
            webinyVersion: "0.0.0",
            revisionLastPublishedOn: null,
            modifiedBy: user,
            rawValues: {
                "object@fields": [
                    { "json@settings": { defaultValue: null }, "object@validation": [] }
                ],
                "object@steps": [{ "json@layout": [["h4WRtUvT1t"]] }],
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
        PK: "T#root#L#en-US#CMS#CME#65c4994929b99b0008bd6167",
        SK: "P",
        data: {
            modelId: "fbForm",
            revisionCreatedOn: "2024-02-08T09:05:37.331Z",
            lastPublishedOn: "2024-02-08T09:05:41.633Z",
            meta: {},
            status: "published",
            revisionCreatedBy: user,
            revisionModifiedBy: user,
            createdBy: user,
            entryId: "65c4994929b99b0008bd6167",
            lastPublishedBy: user,
            id: "65c4994929b99b0008bd6167#0002",
            savedBy: user,
            version: 2,
            firstPublishedBy: user,
            location: { folderId: "root" },
            revisionSavedOn: "2024-02-08T09:05:41.633Z",
            locale: "en-US",
            savedOn: "2024-02-08T09:05:41.633Z",
            revisionFirstPublishedBy: user,
            values: {
                "text@formId": "65c4994929b99b0008bd6167",
                "text@name": "Demo form 4",
                "object@fields": [
                    {
                        "text@_id": "h4WRtUvT1t",
                        "text@fieldId": "demoField",
                        "text@type": "text",
                        "text@name": "text",
                        "text@label": "Demo field",
                        "text@placeholderText": null,
                        "text@helpText": null,
                        "object@options": [],
                        "object@validation": []
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
                "text@slug": "demo-form-4-65c4994929b99b0008bd6167"
            },
            firstPublishedOn: "2024-02-08T09:05:41.633Z",
            revisionSavedBy: user,
            revisionFirstPublishedOn: "2024-02-08T09:05:41.633Z",
            tenant: "root",
            revisionModifiedOn: "2024-02-08T09:05:41.633Z",
            revisionLastPublishedBy: user,
            createdOn: "2024-02-08T09:05:13.764Z",
            modifiedOn: "2024-02-08T09:05:41.633Z",
            locked: true,
            webinyVersion: "0.0.0",
            revisionLastPublishedOn: "2024-02-08T09:05:41.633Z",
            modifiedBy: user,
            rawValues: {
                "object@fields": [
                    { "json@settings": { defaultValue: null }, "object@validation": [] }
                ],
                "object@steps": [{ "json@layout": [["h4WRtUvT1t"]] }],
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

    // Form with contact fields, required, organised in 2 steps
    {
        PK: "T#root#L#en-US#CMS#CME#65c4a67e371e020008a5a8cb",
        SK: "L",
        data: {
            modelId: "fbForm",
            revisionCreatedOn: "2024-02-08T10:01:34.873Z",
            status: "published",
            revisionCreatedBy: user,
            createdBy: user,
            entryId: "65c4a67e371e020008a5a8cb",
            id: "65c4a67e371e020008a5a8cb#0001",
            savedBy: user,
            version: 1,
            location: { folderId: "root" },
            revisionSavedOn: "2024-02-08T10:02:12.516Z",
            locale: "en-US",
            savedOn: "2024-02-08T10:02:12.516Z",
            values: {
                "text@formId": "65c4a67e371e020008a5a8cb",
                "text@name": "Demo form 5",
                "object@fields": [
                    {
                        "text@_id": "LdjAJR41d",
                        "text@fieldId": "firstName",
                        "text@type": "text",
                        "text@name": "firstName",
                        "text@label": "First name",
                        "text@placeholderText": null,
                        "text@helpText": null,
                        "object@options": [],
                        "object@validation": []
                    },
                    {
                        "text@_id": "UNZrnwfMR",
                        "text@fieldId": "lastName",
                        "text@type": "text",
                        "text@name": "lastName",
                        "text@label": "Last name",
                        "text@placeholderText": null,
                        "text@helpText": null,
                        "object@options": [],
                        "object@validation": []
                    },
                    {
                        "text@_id": "r6fATib8h",
                        "text@fieldId": "email",
                        "text@type": "text",
                        "text@name": "email",
                        "text@label": "Email",
                        "text@placeholderText": null,
                        "text@helpText": null,
                        "object@options": [],
                        "object@validation": [
                            {
                                "text@name": "pattern",
                                "text@message": "Please enter a valid e-mail."
                            },
                            { "text@name": "required", "text@message": "Value is required." }
                        ]
                    },
                    {
                        "text@_id": "aQH7A-jP8",
                        "text@fieldId": "phoneNumber",
                        "text@type": "text",
                        "text@name": "phoneNumber",
                        "text@label": "Phone number",
                        "text@placeholderText": null,
                        "text@helpText": null,
                        "object@options": [],
                        "object@validation": [
                            { "text@name": "required", "text@message": "Value is required." }
                        ]
                    },
                    {
                        "text@_id": "Di_Wwktpk",
                        "text@fieldId": "website",
                        "text@type": "text",
                        "text@name": "website",
                        "text@label": "Website",
                        "text@placeholderText": null,
                        "text@helpText": null,
                        "object@options": [],
                        "object@validation": [
                            { "text@name": "pattern", "text@message": "Please enter a valid URL." }
                        ]
                    }
                ],
                "object@steps": [{ "text@title": "Step 1" }, { "text@title": "Step 2" }],
                "object@settings": {
                    "object@layout": { "text@renderer": "default" },
                    "text@submitButtonLabel": null,
                    "boolean@fullWidthSubmitButton": null,
                    "object@reCaptcha": {
                        "boolean@enabled": null,
                        "text@errorMessage": "Please verify that you are not a robot."
                    }
                },
                "text@slug": "demo-form-5-65c4a67e371e020008a5a8cb"
            },
            revisionSavedBy: user,
            tenant: "root",
            createdOn: "2024-02-08T10:01:34.873Z",
            locked: true,
            webinyVersion: "0.0.0",
            revisionModifiedOn: "2024-02-08T10:02:12.516Z",
            revisionFirstPublishedOn: "2024-02-08T10:02:12.516Z",
            revisionLastPublishedOn: "2024-02-08T10:02:12.516Z",
            revisionModifiedBy: user,
            revisionFirstPublishedBy: user,
            revisionLastPublishedBy: user,
            modifiedOn: "2024-02-08T10:02:12.516Z",
            firstPublishedOn: "2024-02-08T10:02:12.516Z",
            lastPublishedOn: "2024-02-08T10:02:12.516Z",
            modifiedBy: user,
            firstPublishedBy: user,
            lastPublishedBy: user,
            meta: {},
            rawValues: {
                "object@fields": [
                    { "json@settings": { defaultValue: null }, "object@validation": [] },
                    { "json@settings": { defaultValue: null }, "object@validation": [] },
                    {
                        "object@validation": [
                            { "json@settings": { flags: null, regex: null, preset: "email" } },
                            { "json@settings": {} }
                        ],
                        "json@settings": { defaultValue: null }
                    },
                    {
                        "object@validation": [{ "json@settings": {} }],
                        "json@settings": { defaultValue: null }
                    },
                    {
                        "object@validation": [
                            { "json@settings": { flags: null, regex: null, preset: "url" } }
                        ],
                        "json@settings": { defaultValue: null }
                    }
                ],
                "object@steps": [
                    { "json@layout": [["r6fATib8h"], ["LdjAJR41d"], ["UNZrnwfMR"]] },
                    { "json@layout": [["aQH7A-jP8"], ["Di_Wwktpk"]] }
                ],
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
        PK: "T#root#L#en-US#CMS#CME#65c4a67e371e020008a5a8cb",
        SK: "P",
        data: {
            modelId: "fbForm",
            revisionCreatedOn: "2024-02-08T10:01:34.873Z",
            status: "published",
            meta: {},
            revisionCreatedBy: user,
            revisionModifiedBy: user,
            createdBy: user,
            entryId: "65c4a67e371e020008a5a8cb",
            id: "65c4a67e371e020008a5a8cb#0001",
            savedBy: user,
            version: 1,
            location: { folderId: "root" },
            revisionSavedOn: "2024-02-08T10:02:12.516Z",
            locale: "en-US",
            savedOn: "2024-02-08T10:02:12.516Z",
            values: {
                "text@formId": "65c4a67e371e020008a5a8cb",
                "text@name": "Demo form 5",
                "object@fields": [
                    {
                        "text@_id": "LdjAJR41d",
                        "text@fieldId": "firstName",
                        "text@type": "text",
                        "text@name": "firstName",
                        "text@label": "First name",
                        "text@placeholderText": null,
                        "text@helpText": null,
                        "object@options": [],
                        "object@validation": []
                    },
                    {
                        "text@_id": "UNZrnwfMR",
                        "text@fieldId": "lastName",
                        "text@type": "text",
                        "text@name": "lastName",
                        "text@label": "Last name",
                        "text@placeholderText": null,
                        "text@helpText": null,
                        "object@options": [],
                        "object@validation": []
                    },
                    {
                        "text@_id": "r6fATib8h",
                        "text@fieldId": "email",
                        "text@type": "text",
                        "text@name": "email",
                        "text@label": "Email",
                        "text@placeholderText": null,
                        "text@helpText": null,
                        "object@options": [],
                        "object@validation": [
                            {
                                "text@name": "pattern",
                                "text@message": "Please enter a valid e-mail."
                            },
                            { "text@name": "required", "text@message": "Value is required." }
                        ]
                    },
                    {
                        "text@_id": "aQH7A-jP8",
                        "text@fieldId": "phoneNumber",
                        "text@type": "text",
                        "text@name": "phoneNumber",
                        "text@label": "Phone number",
                        "text@placeholderText": null,
                        "text@helpText": null,
                        "object@options": [],
                        "object@validation": [
                            { "text@name": "required", "text@message": "Value is required." }
                        ]
                    },
                    {
                        "text@_id": "Di_Wwktpk",
                        "text@fieldId": "website",
                        "text@type": "text",
                        "text@name": "website",
                        "text@label": "Website",
                        "text@placeholderText": null,
                        "text@helpText": null,
                        "object@options": [],
                        "object@validation": [
                            { "text@name": "pattern", "text@message": "Please enter a valid URL." }
                        ]
                    }
                ],
                "object@steps": [{ "text@title": "Step 1" }, { "text@title": "Step 2" }],
                "object@settings": {
                    "object@layout": { "text@renderer": "default" },
                    "text@submitButtonLabel": null,
                    "boolean@fullWidthSubmitButton": null,
                    "object@reCaptcha": {
                        "boolean@enabled": null,
                        "text@errorMessage": "Please verify that you are not a robot."
                    }
                },
                "text@slug": "demo-form-5-65c4a67e371e020008a5a8cb"
            },
            revisionSavedBy: user,
            tenant: "root",
            revisionModifiedOn: "2024-02-08T10:02:12.516Z",
            createdOn: "2024-02-08T10:01:34.873Z",
            modifiedOn: "2024-02-08T10:02:12.516Z",
            locked: true,
            webinyVersion: "0.0.0",
            modifiedBy: user,
            firstPublishedOn: "2024-02-08T10:02:12.516Z",
            lastPublishedOn: "2024-02-08T10:02:12.516Z",
            firstPublishedBy: user,
            lastPublishedBy: user,
            revisionFirstPublishedOn: "2024-02-08T10:02:12.516Z",
            revisionLastPublishedOn: "2024-02-08T10:02:12.516Z",
            revisionFirstPublishedBy: user,
            revisionLastPublishedBy: user,
            rawValues: {
                "object@fields": [
                    { "json@settings": { defaultValue: null }, "object@validation": [] },
                    { "json@settings": { defaultValue: null }, "object@validation": [] },
                    {
                        "object@validation": [
                            { "json@settings": { flags: null, regex: null, preset: "email" } },
                            { "json@settings": {} }
                        ],
                        "json@settings": { defaultValue: null }
                    },
                    {
                        "object@validation": [{ "json@settings": {} }],
                        "json@settings": { defaultValue: null }
                    },
                    {
                        "object@validation": [
                            { "json@settings": { flags: null, regex: null, preset: "url" } }
                        ],
                        "json@settings": { defaultValue: null }
                    }
                ],
                "object@steps": [
                    { "json@layout": [["r6fATib8h"], ["LdjAJR41d"], ["UNZrnwfMR"]] },
                    { "json@layout": [["aQH7A-jP8"], ["Di_Wwktpk"]] }
                ],
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

    // Form with default fields
    {
        PK: "T#root#L#en-US#CMS#CME#65c4c9d05e7aad0008b21715",
        SK: "L",
        data: {
            modelId: "fbForm",
            revisionCreatedOn: "2024-02-08T12:32:16.133Z",
            status: "published",
            revisionCreatedBy: user,
            createdBy: user,
            entryId: "65c4c9d05e7aad0008b21715",
            id: "65c4c9d05e7aad0008b21715#0001",
            savedBy: user,
            version: 1,
            location: { folderId: "root" },
            revisionSavedOn: "2024-02-08T12:36:36.667Z",
            locale: "en-US",
            savedOn: "2024-02-08T12:36:36.667Z",
            values: {
                "text@formId": "65c4c9d05e7aad0008b21715",
                "text@name": "Demo form 6",
                "object@fields": [
                    {
                        "text@_id": "iSDmskA_Tt",
                        "text@fieldId": "hiddenField",
                        "text@type": "hidden",
                        "text@name": "hidden",
                        "text@label": "Hidden field",
                        "text@placeholderText": null,
                        "text@helpText": "Hidden field help text",
                        "object@options": [],
                        "object@validation": []
                    },
                    {
                        "text@_id": "CBZ0tNIQaV",
                        "text@fieldId": "selectField",
                        "text@type": "select",
                        "text@name": "select",
                        "text@label": "Select field",
                        "text@placeholderText": "Select field placeholder text",
                        "text@helpText": "Select field help text",
                        "object@options": [
                            { "text@label": "Option 1", "text@value": "option1" },
                            { "text@label": "Option 2", "text@value": "option2" },
                            { "text@label": "Option 3", "text@value": "option3" }
                        ],
                        "object@validation": [
                            { "text@name": "required", "text@message": "Value is required." }
                        ]
                    },
                    {
                        "text@_id": "B8dDiYSSRF",
                        "text@fieldId": "shortText",
                        "text@type": "text",
                        "text@name": "text",
                        "text@label": "Short text",
                        "text@placeholderText": "Short text placeholder text",
                        "text@helpText": "Short text help text",
                        "object@options": [],
                        "object@validation": []
                    },
                    {
                        "text@_id": "iDfaI8P1dZ",
                        "text@fieldId": "longText",
                        "text@type": "textarea",
                        "text@name": "textarea",
                        "text@label": "Long text",
                        "text@placeholderText": "Long text placeholder text",
                        "text@helpText": "Long text help text",
                        "object@validation": [
                            { "text@name": "minLength", "text@message": "Value is too short." },
                            { "text@name": "maxLength", "text@message": "Value is too long." }
                        ],
                        "object@options": []
                    },
                    {
                        "text@_id": "KR1AHgvW1L",
                        "text@fieldId": "numberField",
                        "text@type": "number",
                        "text@name": "number",
                        "text@label": "Number field",
                        "text@placeholderText": "Number field placeholder text",
                        "text@helpText": "Number field help text",
                        "object@options": [],
                        "object@validation": []
                    },
                    {
                        "text@_id": "pUgH-pWnkW",
                        "text@fieldId": "radioField",
                        "text@type": "radio",
                        "text@name": "radio",
                        "text@label": "Radio field",
                        "text@placeholderText": null,
                        "text@helpText": "Radio field help text",
                        "object@options": [
                            { "text@label": "Option 1", "text@value": "option1" },
                            { "text@label": "Option 2", "text@value": "option2" },
                            { "text@label": "Option 3", "text@value": "option3" }
                        ],
                        "object@validation": []
                    },
                    {
                        "text@_id": "nFYVV5X8Tn",
                        "text@fieldId": "checkboxesField",
                        "text@type": "checkbox",
                        "text@name": "checkbox",
                        "text@label": "Checkboxes field",
                        "text@placeholderText": null,
                        "text@helpText": "Checkboxes field help text",
                        "object@options": [
                            { "text@label": "Option 1", "text@value": "option1" },
                            { "text@label": "Option 2", "text@value": "option2" },
                            { "text@label": "Option 3", "text@value": "option3" }
                        ],
                        "object@validation": []
                    },
                    {
                        "text@_id": "P0dxAwg20f",
                        "text@fieldId": "dateTimeField",
                        "text@type": "datetime",
                        "text@name": "date",
                        "text@label": "DateTime field",
                        "text@placeholderText": null,
                        "text@helpText": "DateTime field help text",
                        "object@options": [],
                        "object@validation": []
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
                "text@slug": "demo-form-6-65c4c9d05e7aad0008b21715"
            },
            revisionSavedBy: user,
            tenant: "root",
            createdOn: "2024-02-08T12:32:16.133Z",
            locked: true,
            webinyVersion: "0.0.0",
            revisionModifiedOn: "2024-02-08T12:36:36.667Z",
            revisionFirstPublishedOn: "2024-02-08T12:36:36.667Z",
            revisionLastPublishedOn: "2024-02-08T12:36:36.667Z",
            revisionModifiedBy: user,
            revisionFirstPublishedBy: user,
            revisionLastPublishedBy: user,
            modifiedOn: "2024-02-08T12:36:36.667Z",
            firstPublishedOn: "2024-02-08T12:36:36.667Z",
            lastPublishedOn: "2024-02-08T12:36:36.667Z",
            modifiedBy: user,
            firstPublishedBy: user,
            lastPublishedBy: user,
            meta: {},
            rawValues: {
                "object@fields": [
                    {
                        "json@settings": { defaultValue: "Hidden field default value" },
                        "object@validation": []
                    },
                    {
                        "object@validation": [{ "json@settings": {} }],
                        "json@settings": { defaultValue: "option2" }
                    },
                    {
                        "json@settings": { defaultValue: "Short text default value" },
                        "object@validation": []
                    },
                    {
                        "object@validation": [
                            { "json@settings": { value: "1" } },
                            { "json@settings": { value: "100" } }
                        ],
                        "json@settings": { rows: "10", defaultValue: "Long text default value" }
                    },
                    { "json@settings": { defaultValue: null }, "object@validation": [] },
                    {
                        "json@settings": { defaultValue: "option2", otherOption: true },
                        "object@validation": []
                    },
                    {
                        "object@validation": [],
                        "json@settings": { defaultValue: ["option2"], otherOption: true }
                    },
                    {
                        "json@settings": { format: "date", defaultValue: null },
                        "object@validation": []
                    }
                ],
                "object@steps": [
                    {
                        "json@layout": [
                            ["iSDmskA_Tt"],
                            ["CBZ0tNIQaV"],
                            ["B8dDiYSSRF"],
                            ["iDfaI8P1dZ"],
                            ["KR1AHgvW1L"],
                            ["pUgH-pWnkW", "nFYVV5X8Tn"],
                            ["P0dxAwg20f"]
                        ]
                    }
                ],
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
        PK: "T#root#L#en-US#CMS#CME#65c4c9d05e7aad0008b21715",
        SK: "P",
        data: {
            modelId: "fbForm",
            revisionCreatedOn: "2024-02-08T12:32:16.133Z",
            status: "published",
            meta: {},
            revisionCreatedBy: user,
            revisionModifiedBy: user,
            createdBy: user,
            entryId: "65c4c9d05e7aad0008b21715",
            id: "65c4c9d05e7aad0008b21715#0001",
            savedBy: user,
            version: 1,
            location: { folderId: "root" },
            revisionSavedOn: "2024-02-08T12:36:36.667Z",
            locale: "en-US",
            savedOn: "2024-02-08T12:36:36.667Z",
            values: {
                "text@formId": "65c4c9d05e7aad0008b21715",
                "text@name": "Demo form 6",
                "object@fields": [
                    {
                        "text@_id": "iSDmskA_Tt",
                        "text@fieldId": "hiddenField",
                        "text@type": "hidden",
                        "text@name": "hidden",
                        "text@label": "Hidden field",
                        "text@placeholderText": null,
                        "text@helpText": "Hidden field help text",
                        "object@options": [],
                        "object@validation": []
                    },
                    {
                        "text@_id": "CBZ0tNIQaV",
                        "text@fieldId": "selectField",
                        "text@type": "select",
                        "text@name": "select",
                        "text@label": "Select field",
                        "text@placeholderText": "Select field placeholder text",
                        "text@helpText": "Select field help text",
                        "object@options": [
                            { "text@label": "Option 1", "text@value": "option1" },
                            { "text@label": "Option 2", "text@value": "option2" },
                            { "text@label": "Option 3", "text@value": "option3" }
                        ],
                        "object@validation": [
                            { "text@name": "required", "text@message": "Value is required." }
                        ]
                    },
                    {
                        "text@_id": "B8dDiYSSRF",
                        "text@fieldId": "shortText",
                        "text@type": "text",
                        "text@name": "text",
                        "text@label": "Short text",
                        "text@placeholderText": "Short text placeholder text",
                        "text@helpText": "Short text help text",
                        "object@options": [],
                        "object@validation": []
                    },
                    {
                        "text@_id": "iDfaI8P1dZ",
                        "text@fieldId": "longText",
                        "text@type": "textarea",
                        "text@name": "textarea",
                        "text@label": "Long text",
                        "text@placeholderText": "Long text placeholder text",
                        "text@helpText": "Long text help text",
                        "object@options": [],
                        "object@validation": [
                            { "text@name": "minLength", "text@message": "Value is too short." },
                            { "text@name": "maxLength", "text@message": "Value is too long." }
                        ]
                    },
                    {
                        "text@_id": "KR1AHgvW1L",
                        "text@fieldId": "numberField",
                        "text@type": "number",
                        "text@name": "number",
                        "text@label": "Number field",
                        "text@placeholderText": "Number field placeholder text",
                        "text@helpText": "Number field help text",
                        "object@options": [],
                        "object@validation": []
                    },
                    {
                        "text@_id": "pUgH-pWnkW",
                        "text@fieldId": "radioField",
                        "text@type": "radio",
                        "text@name": "radio",
                        "text@label": "Radio field",
                        "text@placeholderText": null,
                        "text@helpText": "Radio field help text",
                        "object@validation": [],
                        "object@options": [
                            { "text@label": "Option 1", "text@value": "option1" },
                            { "text@label": "Option 2", "text@value": "option2" },
                            { "text@label": "Option 3", "text@value": "option3" }
                        ]
                    },
                    {
                        "text@_id": "nFYVV5X8Tn",
                        "text@fieldId": "checkboxesField",
                        "text@type": "checkbox",
                        "text@name": "checkbox",
                        "text@label": "Checkboxes field",
                        "text@placeholderText": null,
                        "text@helpText": "Checkboxes field help text",
                        "object@options": [
                            { "text@label": "Option 1", "text@value": "option1" },
                            { "text@label": "Option 2", "text@value": "option2" },
                            { "text@label": "Option 3", "text@value": "option3" }
                        ],
                        "object@validation": []
                    },
                    {
                        "text@_id": "P0dxAwg20f",
                        "text@fieldId": "dateTimeField",
                        "text@type": "datetime",
                        "text@name": "date",
                        "text@label": "DateTime field",
                        "text@placeholderText": null,
                        "text@helpText": "DateTime field help text",
                        "object@options": [],
                        "object@validation": []
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
                "text@slug": "demo-form-6-65c4c9d05e7aad0008b21715"
            },
            revisionSavedBy: user,
            tenant: "root",
            revisionModifiedOn: "2024-02-08T12:36:36.667Z",
            createdOn: "2024-02-08T12:32:16.133Z",
            modifiedOn: "2024-02-08T12:36:36.667Z",
            locked: true,
            webinyVersion: "0.0.0",
            modifiedBy: user,
            firstPublishedOn: "2024-02-08T12:36:36.667Z",
            lastPublishedOn: "2024-02-08T12:36:36.667Z",
            firstPublishedBy: user,
            lastPublishedBy: user,
            revisionFirstPublishedOn: "2024-02-08T12:36:36.667Z",
            revisionLastPublishedOn: "2024-02-08T12:36:36.667Z",
            revisionFirstPublishedBy: user,
            revisionLastPublishedBy: user,
            rawValues: {
                "object@fields": [
                    {
                        "json@settings": { defaultValue: "Hidden field default value" },
                        "object@validation": []
                    },
                    {
                        "object@validation": [{ "json@settings": {} }],
                        "json@settings": { defaultValue: "option2" }
                    },
                    {
                        "json@settings": { defaultValue: "Short text default value" },
                        "object@validation": []
                    },
                    {
                        "object@validation": [
                            { "json@settings": { value: "1" } },
                            { "json@settings": { value: "100" } }
                        ],
                        "json@settings": { rows: "10", defaultValue: "Long text default value" }
                    },
                    { "json@settings": { defaultValue: null }, "object@validation": [] },
                    {
                        "json@settings": { defaultValue: "option2", otherOption: true },
                        "object@validation": []
                    },
                    {
                        "json@settings": { defaultValue: ["option2"], otherOption: true },
                        "object@validation": []
                    },
                    {
                        "json@settings": { format: "date", defaultValue: null },
                        "object@validation": []
                    }
                ],
                "object@steps": [
                    {
                        "json@layout": [
                            ["iSDmskA_Tt"],
                            ["CBZ0tNIQaV"],
                            ["B8dDiYSSRF"],
                            ["iDfaI8P1dZ"],
                            ["KR1AHgvW1L"],
                            ["pUgH-pWnkW", "nFYVV5X8Tn"],
                            ["P0dxAwg20f"]
                        ]
                    }
                ],
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

    // Form with custom settings
    {
        PK: "T#root#L#en-US#CMS#CME#65c4d1dfb0bf8a00087fbcd6",
        SK: "L",
        data: {
            modelId: "fbForm",
            revisionCreatedOn: "2024-02-08T13:06:39.264Z",
            status: "draft",
            revisionCreatedBy: user,
            createdBy: user,
            entryId: "65c4d1dfb0bf8a00087fbcd6",
            id: "65c4d1dfb0bf8a00087fbcd6#0001",
            savedBy: user,
            version: 1,
            location: {
                folderId: "root"
            },
            revisionSavedOn: "2024-02-08T13:07:56.618Z",
            locale: "en-US",
            savedOn: "2024-02-08T13:07:56.618Z",
            values: {
                "text@formId": "65c4d1dfb0bf8a00087fbcd6",
                "text@name": "Demo form 7",
                "object@fields": [
                    {
                        "text@_id": "ItPh6LB1jL",
                        "text@fieldId": "demoField",
                        "text@type": "text",
                        "text@name": "text",
                        "text@label": "Demo field",
                        "text@placeholderText": null,
                        "text@helpText": null,
                        "object@options": [],
                        "object@validation": []
                    }
                ],
                "object@steps": [
                    {
                        "text@title": "Step 1"
                    }
                ],
                "object@settings": {
                    "object@layout": {
                        "text@renderer": "default"
                    },
                    "text@submitButtonLabel": "Custom submit button label",
                    "boolean@fullWidthSubmitButton": true,
                    "object@termsOfServiceMessage": {
                        "boolean@enabled": true,
                        "text@errorMessage": "Custom error message"
                    },
                    "object@reCaptcha": {
                        "boolean@enabled": null,
                        "text@errorMessage": "Please verify that you are not a robot."
                    }
                },
                "text@slug": "demo-form-7-65c4d1dfb0bf8a00087fbcd6"
            },
            revisionSavedBy: user,
            tenant: "root",
            createdOn: "2024-02-08T13:06:39.264Z",
            locked: false,
            webinyVersion: "0.0.0",
            revisionModifiedOn: "2024-02-08T13:07:56.618Z",
            revisionFirstPublishedOn: null,
            revisionLastPublishedOn: null,
            revisionModifiedBy: user,
            revisionFirstPublishedBy: null,
            revisionLastPublishedBy: null,
            modifiedOn: "2024-02-08T13:07:56.618Z",
            firstPublishedOn: null,
            lastPublishedOn: null,
            modifiedBy: user,
            firstPublishedBy: null,
            lastPublishedBy: null,
            meta: {},
            rawValues: {
                "object@fields": [
                    {
                        "json@settings": {
                            defaultValue: null
                        },
                        "object@validation": []
                    }
                ],
                "object@steps": [
                    {
                        "json@layout": [["ItPh6LB1jL"]]
                    }
                ],
                "object@settings": {
                    "object@layout": {},
                    "json@successMessage": [
                        {
                            type: "paragraph",
                            data: {
                                textAlign: "start",
                                className: null,
                                text: "Custom success message"
                            },
                            id: "A6l0TC3oER"
                        }
                    ],
                    "object@termsOfServiceMessage": {
                        "json@message": [
                            {
                                type: "paragraph",
                                data: {
                                    textAlign: "start",
                                    className: null,
                                    text: "Custom term of service message"
                                },
                                id: "3UTfrPvarm"
                            }
                        ]
                    },
                    "object@reCaptcha": {}
                },
                "json@triggers": null
            },
            latest: true,
            TYPE: "cms.entry.l",
            __type: "cms.entry.l"
        }
    },

    // Form 1 from root tenant, locale de-DE
    {
        PK: "T#root#L#de-DE#CMS#CME#65c4ea4ac04244000878b1e9",
        SK: "L",
        data: {
            modelId: "fbForm",
            revisionCreatedOn: "2024-02-08T14:50:50.570Z",
            status: "published",
            revisionCreatedBy: user,
            createdBy: user,
            entryId: "65c4ea4ac04244000878b1e9",
            id: "65c4ea4ac04244000878b1e9#0001",
            savedBy: user,
            version: 1,
            location: {
                folderId: "root"
            },
            revisionSavedOn: "2024-02-08T14:51:05.869Z",
            locale: "de-DE",
            savedOn: "2024-02-08T14:51:05.869Z",
            values: {
                "text@formId": "65c4ea4ac04244000878b1e9",
                "text@name": "Demo form 8",
                "object@fields": [
                    {
                        "text@_id": "-WO0UDy6kr",
                        "text@fieldId": "demoField",
                        "text@type": "text",
                        "text@name": "text",
                        "text@label": "Demo field",
                        "text@placeholderText": null,
                        "text@helpText": null,
                        "object@options": [],
                        "object@validation": []
                    }
                ],
                "object@steps": [
                    {
                        "text@title": "Step 1"
                    }
                ],
                "object@settings": {
                    "object@layout": {
                        "text@renderer": "default"
                    },
                    "text@submitButtonLabel": null,
                    "boolean@fullWidthSubmitButton": null,
                    "object@reCaptcha": {
                        "boolean@enabled": null,
                        "text@errorMessage": "Please verify that you are not a robot."
                    }
                },
                "text@slug": "demo-form-8-65c4ea4ac04244000878b1e9"
            },
            revisionSavedBy: user,
            tenant: "root",
            createdOn: "2024-02-08T14:50:50.570Z",
            locked: true,
            webinyVersion: "0.0.0",
            revisionModifiedOn: "2024-02-08T14:51:05.869Z",
            revisionFirstPublishedOn: "2024-02-08T14:51:05.869Z",
            revisionLastPublishedOn: "2024-02-08T14:51:05.869Z",
            revisionModifiedBy: user,
            revisionFirstPublishedBy: user,
            revisionLastPublishedBy: user,
            modifiedOn: "2024-02-08T14:51:05.869Z",
            firstPublishedOn: "2024-02-08T14:51:05.869Z",
            lastPublishedOn: "2024-02-08T14:51:05.869Z",
            modifiedBy: user,
            firstPublishedBy: user,
            lastPublishedBy: user,
            meta: {},
            rawValues: {
                "object@fields": [
                    {
                        "json@settings": {
                            defaultValue: null
                        },
                        "object@validation": []
                    }
                ],
                "object@steps": [
                    {
                        "json@layout": [["-WO0UDy6kr"]]
                    }
                ],
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
        PK: "T#root#L#de-DE#CMS#CME#65c4ea4ac04244000878b1e9",
        SK: "P",
        data: {
            modelId: "fbForm",
            revisionCreatedOn: "2024-02-08T14:50:50.570Z",
            status: "published",
            meta: {},
            revisionCreatedBy: user,
            revisionModifiedBy: user,
            createdBy: user,
            entryId: "65c4ea4ac04244000878b1e9",
            id: "65c4ea4ac04244000878b1e9#0001",
            savedBy: user,
            version: 1,
            location: {
                folderId: "root"
            },
            revisionSavedOn: "2024-02-08T14:51:05.869Z",
            locale: "de-DE",
            savedOn: "2024-02-08T14:51:05.869Z",
            values: {
                "text@formId": "65c4ea4ac04244000878b1e9",
                "text@name": "Demo form 8",
                "object@fields": [
                    {
                        "text@_id": "-WO0UDy6kr",
                        "text@fieldId": "demoField",
                        "text@type": "text",
                        "text@name": "text",
                        "text@label": "Demo field",
                        "text@placeholderText": null,
                        "text@helpText": null,
                        "object@options": [],
                        "object@validation": []
                    }
                ],
                "object@steps": [
                    {
                        "text@title": "Step 1"
                    }
                ],
                "object@settings": {
                    "object@layout": {
                        "text@renderer": "default"
                    },
                    "text@submitButtonLabel": null,
                    "boolean@fullWidthSubmitButton": null,
                    "object@reCaptcha": {
                        "boolean@enabled": null,
                        "text@errorMessage": "Please verify that you are not a robot."
                    }
                },
                "text@slug": "demo-form-8-65c4ea4ac04244000878b1e9"
            },
            revisionSavedBy: user,
            tenant: "root",
            revisionModifiedOn: "2024-02-08T14:51:05.869Z",
            createdOn: "2024-02-08T14:50:50.570Z",
            modifiedOn: "2024-02-08T14:51:05.869Z",
            locked: true,
            webinyVersion: "0.0.0",
            modifiedBy: user,
            firstPublishedOn: "2024-02-08T14:51:05.869Z",
            lastPublishedOn: "2024-02-08T14:51:05.869Z",
            firstPublishedBy: user,
            lastPublishedBy: user,
            revisionFirstPublishedOn: "2024-02-08T14:51:05.869Z",
            revisionLastPublishedOn: "2024-02-08T14:51:05.869Z",
            revisionFirstPublishedBy: user,
            revisionLastPublishedBy: user,
            rawValues: {
                "object@fields": [
                    {
                        "json@settings": {
                            defaultValue: null
                        },
                        "object@validation": []
                    }
                ],
                "object@steps": [
                    {
                        "json@layout": [["-WO0UDy6kr"]]
                    }
                ],
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

    // Form 2 from root tenant, locale de-DE
    {
        PK: "T#root#L#de-DE#CMS#CME#65c4ea4ac04244000878b1f0",
        SK: "L",
        data: {
            modelId: "fbForm",
            revisionCreatedOn: "2024-02-08T14:50:50.570Z",
            status: "published",
            revisionCreatedBy: user,
            createdBy: user,
            entryId: "65c4ea4ac04244000878b1f0",
            id: "65c4ea4ac04244000878b1f0#0001",
            savedBy: user,
            version: 1,
            location: {
                folderId: "root"
            },
            revisionSavedOn: "2024-02-08T14:51:05.869Z",
            locale: "de-DE",
            savedOn: "2024-02-08T14:51:05.869Z",
            values: {
                "text@formId": "65c4ea4ac04244000878b1f0",
                "text@name": "Demo form 9",
                "object@fields": [
                    {
                        "text@_id": "-WO0UDy6l3",
                        "text@fieldId": "demoField",
                        "text@type": "text",
                        "text@name": "text",
                        "text@label": "Demo field",
                        "text@placeholderText": null,
                        "text@helpText": null,
                        "object@options": [],
                        "object@validation": []
                    }
                ],
                "object@steps": [
                    {
                        "text@title": "Step 1"
                    }
                ],
                "object@settings": {
                    "object@layout": {
                        "text@renderer": "default"
                    },
                    "text@submitButtonLabel": null,
                    "boolean@fullWidthSubmitButton": null,
                    "object@reCaptcha": {
                        "boolean@enabled": null,
                        "text@errorMessage": "Please verify that you are not a robot."
                    }
                },
                "text@slug": "demo-form-9-65c4ea4ac04244000878b1f0"
            },
            revisionSavedBy: user,
            tenant: "root",
            createdOn: "2024-02-08T14:50:50.570Z",
            locked: true,
            webinyVersion: "0.0.0",
            revisionModifiedOn: "2024-02-08T14:51:05.869Z",
            revisionFirstPublishedOn: "2024-02-08T14:51:05.869Z",
            revisionLastPublishedOn: "2024-02-08T14:51:05.869Z",
            revisionModifiedBy: user,
            revisionFirstPublishedBy: user,
            revisionLastPublishedBy: user,
            modifiedOn: "2024-02-08T14:51:05.869Z",
            firstPublishedOn: "2024-02-08T14:51:05.869Z",
            lastPublishedOn: "2024-02-08T14:51:05.869Z",
            modifiedBy: user,
            firstPublishedBy: user,
            lastPublishedBy: user,
            meta: {},
            rawValues: {
                "object@fields": [
                    {
                        "json@settings": {
                            defaultValue: null
                        },
                        "object@validation": []
                    }
                ],
                "object@steps": [
                    {
                        "json@layout": [["-WO0UDy6l3"]]
                    }
                ],
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
        PK: "T#root#L#de-DE#CMS#CME#65c4ea4ac04244000878b1f0",
        SK: "P",
        data: {
            modelId: "fbForm",
            revisionCreatedOn: "2024-02-08T14:50:50.570Z",
            status: "published",
            meta: {},
            revisionCreatedBy: user,
            revisionModifiedBy: user,
            createdBy: user,
            entryId: "65c4ea4ac04244000878b1f0",
            id: "65c4ea4ac04244000878b1f0#0001",
            savedBy: user,
            version: 1,
            location: {
                folderId: "root"
            },
            revisionSavedOn: "2024-02-08T14:51:05.869Z",
            locale: "de-DE",
            savedOn: "2024-02-08T14:51:05.869Z",
            values: {
                "text@formId": "65c4ea4ac04244000878b1f0",
                "text@name": "Demo form 9",
                "object@fields": [
                    {
                        "text@_id": "-WO0UDy6l3",
                        "text@fieldId": "demoField",
                        "text@type": "text",
                        "text@name": "text",
                        "text@label": "Demo field",
                        "text@placeholderText": null,
                        "text@helpText": null,
                        "object@options": [],
                        "object@validation": []
                    }
                ],
                "object@steps": [
                    {
                        "text@title": "Step 1"
                    }
                ],
                "object@settings": {
                    "object@layout": {
                        "text@renderer": "default"
                    },
                    "text@submitButtonLabel": null,
                    "boolean@fullWidthSubmitButton": null,
                    "object@reCaptcha": {
                        "boolean@enabled": null,
                        "text@errorMessage": "Please verify that you are not a robot."
                    }
                },
                "text@slug": "demo-form-9-65c4ea4ac04244000878b1f0"
            },
            revisionSavedBy: user,
            tenant: "root",
            revisionModifiedOn: "2024-02-08T14:51:05.869Z",
            createdOn: "2024-02-08T14:50:50.570Z",
            modifiedOn: "2024-02-08T14:51:05.869Z",
            locked: true,
            webinyVersion: "0.0.0",
            modifiedBy: user,
            firstPublishedOn: "2024-02-08T14:51:05.869Z",
            lastPublishedOn: "2024-02-08T14:51:05.869Z",
            firstPublishedBy: user,
            lastPublishedBy: user,
            revisionFirstPublishedOn: "2024-02-08T14:51:05.869Z",
            revisionLastPublishedOn: "2024-02-08T14:51:05.869Z",
            revisionFirstPublishedBy: user,
            revisionLastPublishedBy: user,
            rawValues: {
                "object@fields": [
                    {
                        "json@settings": {
                            defaultValue: null
                        },
                        "object@validation": []
                    }
                ],
                "object@steps": [
                    {
                        "json@layout": [["-WO0UDy6l3"]]
                    }
                ],
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

    // Form 1 from root tenant, locale fr-FR
    {
        PK: "T#root#L#fr-FR#CMS#CME#65c4ea4ac04244000878b1f1",
        SK: "L",
        data: {
            modelId: "fbForm",
            revisionCreatedOn: "2024-02-08T14:50:50.570Z",
            status: "published",
            revisionCreatedBy: user,
            createdBy: user,
            entryId: "65c4ea4ac04244000878b1f1",
            id: "65c4ea4ac04244000878b1f1#0001",
            savedBy: user,
            version: 1,
            location: {
                folderId: "root"
            },
            revisionSavedOn: "2024-02-08T14:51:05.869Z",
            locale: "fr-FR",
            savedOn: "2024-02-08T14:51:05.869Z",
            values: {
                "text@formId": "65c4ea4ac04244000878b1f1",
                "text@name": "Demo form 10",
                "object@fields": [
                    {
                        "text@_id": "-WO0UDy6m2",
                        "text@fieldId": "demoField",
                        "text@type": "text",
                        "text@name": "text",
                        "text@label": "Demo field",
                        "text@placeholderText": null,
                        "text@helpText": null,
                        "object@options": [],
                        "object@validation": []
                    }
                ],
                "object@steps": [
                    {
                        "text@title": "Step 1"
                    }
                ],
                "object@settings": {
                    "object@layout": {
                        "text@renderer": "default"
                    },
                    "text@submitButtonLabel": null,
                    "boolean@fullWidthSubmitButton": null,
                    "object@reCaptcha": {
                        "boolean@enabled": null,
                        "text@errorMessage": "Please verify that you are not a robot."
                    }
                },
                "text@slug": "demo-form-10-65c4ea4ac04244000878b1f1"
            },
            revisionSavedBy: user,
            tenant: "root",
            createdOn: "2024-02-08T14:50:50.570Z",
            locked: true,
            webinyVersion: "0.0.0",
            revisionModifiedOn: "2024-02-08T14:51:05.869Z",
            revisionFirstPublishedOn: "2024-02-08T14:51:05.869Z",
            revisionLastPublishedOn: "2024-02-08T14:51:05.869Z",
            revisionModifiedBy: user,
            revisionFirstPublishedBy: user,
            revisionLastPublishedBy: user,
            modifiedOn: "2024-02-08T14:51:05.869Z",
            firstPublishedOn: "2024-02-08T14:51:05.869Z",
            lastPublishedOn: "2024-02-08T14:51:05.869Z",
            modifiedBy: user,
            firstPublishedBy: user,
            lastPublishedBy: user,
            meta: {},
            rawValues: {
                "object@fields": [
                    {
                        "json@settings": {
                            defaultValue: null
                        },
                        "object@validation": []
                    }
                ],
                "object@steps": [
                    {
                        "json@layout": [["-WO0UDy6m2"]]
                    }
                ],
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
        PK: "T#root#L#fr-FR#CMS#CME#65c4ea4ac04244000878b1f1",
        SK: "P",
        data: {
            modelId: "fbForm",
            revisionCreatedOn: "2024-02-08T14:50:50.570Z",
            status: "published",
            meta: {},
            revisionCreatedBy: user,
            revisionModifiedBy: user,
            createdBy: user,
            entryId: "65c4ea4ac04244000878b1f1",
            id: "65c4ea4ac04244000878b1f1#0001",
            savedBy: user,
            version: 1,
            location: {
                folderId: "root"
            },
            revisionSavedOn: "2024-02-08T14:51:05.869Z",
            locale: "fr-FR",
            savedOn: "2024-02-08T14:51:05.869Z",
            values: {
                "text@formId": "65c4ea4ac04244000878b1f1",
                "text@name": "Demo form 10",
                "object@fields": [
                    {
                        "text@_id": "-WO0UDy6m2",
                        "text@fieldId": "demoField",
                        "text@type": "text",
                        "text@name": "text",
                        "text@label": "Demo field",
                        "text@placeholderText": null,
                        "text@helpText": null,
                        "object@options": [],
                        "object@validation": []
                    }
                ],
                "object@steps": [
                    {
                        "text@title": "Step 1"
                    }
                ],
                "object@settings": {
                    "object@layout": {
                        "text@renderer": "default"
                    },
                    "text@submitButtonLabel": null,
                    "boolean@fullWidthSubmitButton": null,
                    "object@reCaptcha": {
                        "boolean@enabled": null,
                        "text@errorMessage": "Please verify that you are not a robot."
                    }
                },
                "text@slug": "demo-form-10-65c4ea4ac04244000878b1f1"
            },
            revisionSavedBy: user,
            tenant: "root",
            revisionModifiedOn: "2024-02-08T14:51:05.869Z",
            createdOn: "2024-02-08T14:50:50.570Z",
            modifiedOn: "2024-02-08T14:51:05.869Z",
            locked: true,
            webinyVersion: "0.0.0",
            modifiedBy: user,
            firstPublishedOn: "2024-02-08T14:51:05.869Z",
            lastPublishedOn: "2024-02-08T14:51:05.869Z",
            firstPublishedBy: user,
            lastPublishedBy: user,
            revisionFirstPublishedOn: "2024-02-08T14:51:05.869Z",
            revisionLastPublishedOn: "2024-02-08T14:51:05.869Z",
            revisionFirstPublishedBy: user,
            revisionLastPublishedBy: user,
            rawValues: {
                "object@fields": [
                    {
                        "json@settings": {
                            defaultValue: null
                        },
                        "object@validation": []
                    }
                ],
                "object@steps": [
                    {
                        "json@layout": [["-WO0UDy6m2"]]
                    }
                ],
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

    // Form 1 from otherTenant tenant, locale fr-FR
    {
        PK: "T#otherTenant#L#fr-FR#CMS#CME#65c4ea4ac04244000878b1f2",
        SK: "L",
        data: {
            modelId: "fbForm",
            revisionCreatedOn: "2024-02-08T14:50:50.570Z",
            status: "published",
            revisionCreatedBy: user,
            createdBy: user,
            entryId: "65c4ea4ac04244000878b1f2",
            id: "65c4ea4ac04244000878b1f2#0001",
            savedBy: user,
            version: 1,
            location: {
                folderId: "root"
            },
            revisionSavedOn: "2024-02-08T14:51:05.869Z",
            locale: "fr-FR",
            savedOn: "2024-02-08T14:51:05.869Z",
            values: {
                "text@formId": "65c4ea4ac04244000878b1f2",
                "text@name": "Demo form 11",
                "object@fields": [
                    {
                        "text@_id": "-WO0VQh3n5",
                        "text@fieldId": "demoField",
                        "text@type": "text",
                        "text@name": "text",
                        "text@label": "Demo field",
                        "text@placeholderText": null,
                        "text@helpText": null,
                        "object@options": [],
                        "object@validation": []
                    }
                ],
                "object@steps": [
                    {
                        "text@title": "Step 1"
                    }
                ],
                "object@settings": {
                    "object@layout": {
                        "text@renderer": "default"
                    },
                    "text@submitButtonLabel": null,
                    "boolean@fullWidthSubmitButton": null,
                    "object@reCaptcha": {
                        "boolean@enabled": null,
                        "text@errorMessage": "Please verify that you are not a robot."
                    }
                },
                "text@slug": "demo-form-11-65c4ea4ac04244000878b1f2"
            },
            revisionSavedBy: user,
            tenant: "otherTenant",
            createdOn: "2024-02-08T14:50:50.570Z",
            locked: true,
            webinyVersion: "0.0.0",
            revisionModifiedOn: "2024-02-08T14:51:05.869Z",
            revisionFirstPublishedOn: "2024-02-08T14:51:05.869Z",
            revisionLastPublishedOn: "2024-02-08T14:51:05.869Z",
            revisionModifiedBy: user,
            revisionFirstPublishedBy: user,
            revisionLastPublishedBy: user,
            modifiedOn: "2024-02-08T14:51:05.869Z",
            firstPublishedOn: "2024-02-08T14:51:05.869Z",
            lastPublishedOn: "2024-02-08T14:51:05.869Z",
            modifiedBy: user,
            firstPublishedBy: user,
            lastPublishedBy: user,
            meta: {},
            rawValues: {
                "object@fields": [
                    {
                        "json@settings": {
                            defaultValue: null
                        },
                        "object@validation": []
                    }
                ],
                "object@steps": [
                    {
                        "json@layout": [["-WO0VQh3n5"]]
                    }
                ],
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
        PK: "T#otherTenant#L#fr-FR#CMS#CME#65c4ea4ac04244000878b1f2",
        SK: "P",
        data: {
            modelId: "fbForm",
            revisionCreatedOn: "2024-02-08T14:50:50.570Z",
            status: "published",
            meta: {},
            revisionCreatedBy: user,
            revisionModifiedBy: user,
            createdBy: user,
            entryId: "65c4ea4ac04244000878b1f2",
            id: "65c4ea4ac04244000878b1f2#0001",
            savedBy: user,
            version: 1,
            location: {
                folderId: "root"
            },
            revisionSavedOn: "2024-02-08T14:51:05.869Z",
            locale: "fr-FR",
            savedOn: "2024-02-08T14:51:05.869Z",
            values: {
                "text@formId": "65c4ea4ac04244000878b1f2",
                "text@name": "Demo form 11",
                "object@fields": [
                    {
                        "text@_id": "-WO0VQh3n5",
                        "text@fieldId": "demoField",
                        "text@type": "text",
                        "text@name": "text",
                        "text@label": "Demo field",
                        "text@placeholderText": null,
                        "text@helpText": null,
                        "object@options": [],
                        "object@validation": []
                    }
                ],
                "object@steps": [
                    {
                        "text@title": "Step 1"
                    }
                ],
                "object@settings": {
                    "object@layout": {
                        "text@renderer": "default"
                    },
                    "text@submitButtonLabel": null,
                    "boolean@fullWidthSubmitButton": null,
                    "object@reCaptcha": {
                        "boolean@enabled": null,
                        "text@errorMessage": "Please verify that you are not a robot."
                    }
                },
                "text@slug": "demo-form-11-65c4ea4ac04244000878b1f2"
            },
            revisionSavedBy: user,
            tenant: "otherTenant",
            revisionModifiedOn: "2024-02-08T14:51:05.869Z",
            createdOn: "2024-02-08T14:50:50.570Z",
            modifiedOn: "2024-02-08T14:51:05.869Z",
            locked: true,
            webinyVersion: "0.0.0",
            modifiedBy: user,
            firstPublishedOn: "2024-02-08T14:51:05.869Z",
            lastPublishedOn: "2024-02-08T14:51:05.869Z",
            firstPublishedBy: user,
            lastPublishedBy: user,
            revisionFirstPublishedOn: "2024-02-08T14:51:05.869Z",
            revisionLastPublishedOn: "2024-02-08T14:51:05.869Z",
            revisionFirstPublishedBy: user,
            revisionLastPublishedBy: user,
            rawValues: {
                "object@fields": [
                    {
                        "json@settings": {
                            defaultValue: null
                        },
                        "object@validation": []
                    }
                ],
                "object@steps": [
                    {
                        "json@layout": [["-WO0VQh3n5"]]
                    }
                ],
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

    // Form 2 from otherTenant tenant, locale fr-FR
    {
        PK: "T#otherTenant#L#fr-FR#CMS#CME#65c4ea4ac04244000878b1f3",
        SK: "L",
        data: {
            modelId: "fbForm",
            revisionCreatedOn: "2024-02-08T14:50:50.570Z",
            status: "published",
            revisionCreatedBy: user,
            createdBy: user,
            entryId: "65c4ea4ac04244000878b1f3",
            id: "65c4ea4ac04244000878b1f3#0001",
            savedBy: user,
            version: 1,
            location: {
                folderId: "root"
            },
            revisionSavedOn: "2024-02-08T14:51:05.869Z",
            locale: "fr-FR",
            savedOn: "2024-02-08T14:51:05.869Z",
            values: {
                "text@formId": "65c4ea4ac04244000878b1f3",
                "text@name": "Demo form 12",
                "object@fields": [
                    {
                        "text@_id": "-WO0Tj8p4z",
                        "text@fieldId": "demoField",
                        "text@type": "text",
                        "text@name": "text",
                        "text@label": "Demo field",
                        "text@placeholderText": null,
                        "text@helpText": null,
                        "object@options": [],
                        "object@validation": []
                    }
                ],
                "object@steps": [
                    {
                        "text@title": "Step 1"
                    }
                ],
                "object@settings": {
                    "object@layout": {
                        "text@renderer": "default"
                    },
                    "text@submitButtonLabel": null,
                    "boolean@fullWidthSubmitButton": null,
                    "object@reCaptcha": {
                        "boolean@enabled": null,
                        "text@errorMessage": "Please verify that you are not a robot."
                    }
                },
                "text@slug": "demo-form-12-65c4ea4ac04244000878b1f3"
            },
            revisionSavedBy: user,
            tenant: "otherTenant",
            createdOn: "2024-02-08T14:50:50.570Z",
            locked: true,
            webinyVersion: "0.0.0",
            revisionModifiedOn: "2024-02-08T14:51:05.869Z",
            revisionFirstPublishedOn: "2024-02-08T14:51:05.869Z",
            revisionLastPublishedOn: "2024-02-08T14:51:05.869Z",
            revisionModifiedBy: user,
            revisionFirstPublishedBy: user,
            revisionLastPublishedBy: user,
            modifiedOn: "2024-02-08T14:51:05.869Z",
            firstPublishedOn: "2024-02-08T14:51:05.869Z",
            lastPublishedOn: "2024-02-08T14:51:05.869Z",
            modifiedBy: user,
            firstPublishedBy: user,
            lastPublishedBy: user,
            meta: {},
            rawValues: {
                "object@fields": [
                    {
                        "json@settings": {
                            defaultValue: null
                        },
                        "object@validation": []
                    }
                ],
                "object@steps": [
                    {
                        "json@layout": [["-WO0Tj8p4z"]]
                    }
                ],
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
        PK: "T#otherTenant#L#fr-FR#CMS#CME#65c4ea4ac04244000878b1f3",
        SK: "P",
        data: {
            modelId: "fbForm",
            revisionCreatedOn: "2024-02-08T14:50:50.570Z",
            status: "published",
            meta: {},
            revisionCreatedBy: user,
            revisionModifiedBy: user,
            createdBy: user,
            entryId: "65c4ea4ac04244000878b1f3",
            id: "65c4ea4ac04244000878b1f3#0001",
            savedBy: user,
            version: 1,
            location: {
                folderId: "root"
            },
            revisionSavedOn: "2024-02-08T14:51:05.869Z",
            locale: "fr-FR",
            savedOn: "2024-02-08T14:51:05.869Z",
            values: {
                "text@formId": "65c4ea4ac04244000878b1f3",
                "text@name": "Demo form 12",
                "object@fields": [
                    {
                        "text@_id": "-WO0Tj8p4z",
                        "text@fieldId": "demoField",
                        "text@type": "text",
                        "text@name": "text",
                        "text@label": "Demo field",
                        "text@placeholderText": null,
                        "text@helpText": null,
                        "object@options": [],
                        "object@validation": []
                    }
                ],
                "object@steps": [
                    {
                        "text@title": "Step 1"
                    }
                ],
                "object@settings": {
                    "object@layout": {
                        "text@renderer": "default"
                    },
                    "text@submitButtonLabel": null,
                    "boolean@fullWidthSubmitButton": null,
                    "object@reCaptcha": {
                        "boolean@enabled": null,
                        "text@errorMessage": "Please verify that you are not a robot."
                    }
                },
                "text@slug": "demo-form-12-65c4ea4ac04244000878b1f3"
            },
            revisionSavedBy: user,
            tenant: "otherTenant",
            revisionModifiedOn: "2024-02-08T14:51:05.869Z",
            createdOn: "2024-02-08T14:50:50.570Z",
            modifiedOn: "2024-02-08T14:51:05.869Z",
            locked: true,
            webinyVersion: "0.0.0",
            modifiedBy: user,
            firstPublishedOn: "2024-02-08T14:51:05.869Z",
            lastPublishedOn: "2024-02-08T14:51:05.869Z",
            firstPublishedBy: user,
            lastPublishedBy: user,
            revisionFirstPublishedOn: "2024-02-08T14:51:05.869Z",
            revisionLastPublishedOn: "2024-02-08T14:51:05.869Z",
            revisionFirstPublishedBy: user,
            revisionLastPublishedBy: user,
            rawValues: {
                "object@fields": [
                    {
                        "json@settings": {
                            defaultValue: null
                        },
                        "object@validation": []
                    }
                ],
                "object@steps": [
                    {
                        "json@layout": [["-WO0Tj8p4z"]]
                    }
                ],
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
            PK: `T#${form.tenant}#L#${form.locale}#CMS#CME#${formId}-${revisionId}-stats`,
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
                version: 1,
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

export const createMigratedDdbEsData = () => {
    const migratedDdbEsFormStatsData = getMigratedDdbEsFormStatsData();

    return [...migratedDdbEsFormData, ...migratedDdbEsFormStatsData];
};
