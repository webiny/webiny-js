export const user = {
    id: "admin",
    type: "admin",
    displayName: "Admin"
};

export const migratedFormData = [
    // Form with 2 revisions: 1° published, 2° draft
    {
        PK: "T#root#L#en-US#CMS#CME#CME#65b12c8ecd6a580008f2fa31",
        SK: "L",
        createdBy: user,
        createdOn: "2024-01-24T15:28:14.710Z",
        entryId: "65b12c8ecd6a580008f2fa31",
        firstPublishedBy: user,
        firstPublishedOn: "2024-01-24T15:28:31.263Z",
        GSI1_PK: "T#root#L#en-US#CMS#CME#M#fbForm#L",
        GSI1_SK: "65b12c8ecd6a580008f2fa31#0002",
        id: "65b12c8ecd6a580008f2fa31#0002",
        lastPublishedBy: user,
        lastPublishedOn: "2024-01-24T15:28:31.263Z",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        meta: {},
        modelId: "fbForm",
        modifiedBy: user,
        modifiedOn: "2024-01-24T15:28:41.543Z",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T15:28:37.723Z",
        revisionModifiedBy: user,
        revisionModifiedOn: "2024-01-24T15:28:41.543Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T15:28:41.543Z",
        savedBy: user,
        savedOn: "2024-01-24T15:28:41.543Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry.l",
        values: {
            "json@triggers": null,
            "object@fields": [
                {
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@options": [],
                    "object@validation": [
                        {
                            "json@settings": {},
                            "text@message": "Value is required.",
                            "text@name": "required"
                        }
                    ],
                    "text@fieldId": "demoField",
                    "text@helpText": null,
                    "text@label": "Demo Field",
                    "text@name": "text",
                    "text@placeholderText": null,
                    "text@type": "text",
                    "text@_id": "Pr3Pj3w2zO"
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
                    "json@layout": [["Pr3Pj3w2zO"]],
                    "text@title": "Step 1"
                }
            ],
            "text@formId": "65b12c8ecd6a580008f2fa31",
            "text@name": "Demo Form 1",
            "text@slug": "demo-form-1-65b12c8ecd6a580008f2fa31"
        },
        version: 2,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#CME#65b12c8ecd6a580008f2fa31",
        SK: "P",
        createdBy: user,
        createdOn: "2024-01-24T15:28:14.710Z",
        entryId: "65b12c8ecd6a580008f2fa31",
        firstPublishedBy: user,
        firstPublishedOn: "2024-01-24T15:28:31.263Z",
        GSI1_PK: "T#root#L#en-US#CMS#CME#M#fbForm#P",
        GSI1_SK: "65b12c8ecd6a580008f2fa31#0001",
        id: "65b12c8ecd6a580008f2fa31#0001",
        lastPublishedBy: user,
        lastPublishedOn: "2024-01-24T15:28:31.263Z",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: true,
        meta: {},
        modelId: "fbForm",
        modifiedBy: user,
        modifiedOn: "2024-01-24T15:28:31.263Z",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T15:28:14.710Z",
        revisionFirstPublishedBy: user,
        revisionFirstPublishedOn: "2024-01-24T15:28:31.263Z",
        revisionLastPublishedBy: user,
        revisionLastPublishedOn: "2024-01-24T15:28:31.263Z",
        revisionModifiedBy: user,
        revisionModifiedOn: "2024-01-24T15:28:31.263Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T15:28:31.263Z",
        savedBy: user,
        savedOn: "2024-01-24T15:28:31.263Z",
        status: "published",
        tenant: "root",
        TYPE: "cms.entry.p",
        values: {
            "json@triggers": null,
            "object@fields": [
                {
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@options": [],
                    "object@validation": [],
                    "text@fieldId": "demoField",
                    "text@helpText": null,
                    "text@label": "Demo Field",
                    "text@name": "text",
                    "text@type": "text",
                    "text@placeholderText": null,
                    "text@_id": "Pr3Pj3w2zO"
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
                    "json@layout": [["Pr3Pj3w2zO"]],
                    "text@title": "Step 1"
                }
            ],
            "text@formId": "65b12c8ecd6a580008f2fa31",
            "text@name": "Demo Form 1",
            "text@slug": "demo-form-1-65b12c8ecd6a580008f2fa31"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#CME#65b12c8ecd6a580008f2fa31",
        SK: "REV#0001",
        createdBy: user,
        createdOn: "2024-01-24T15:28:14.710Z",
        entryId: "65b12c8ecd6a580008f2fa31",
        firstPublishedBy: user,
        firstPublishedOn: "2024-01-24T15:28:31.263Z",
        GSI1_PK: "T#root#L#en-US#CMS#CME#M#fbForm#A",
        GSI1_SK: "65b12c8ecd6a580008f2fa31#0001",
        id: "65b12c8ecd6a580008f2fa31#0001",
        lastPublishedBy: user,
        lastPublishedOn: "2024-01-24T15:28:31.263Z",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: true,
        meta: {},
        modelId: "fbForm",
        modifiedBy: user,
        modifiedOn: "2024-01-24T15:28:31.263Z",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T15:28:14.710Z",
        revisionFirstPublishedBy: user,
        revisionFirstPublishedOn: "2024-01-24T15:28:31.263Z",
        revisionLastPublishedBy: user,
        revisionLastPublishedOn: "2024-01-24T15:28:31.263Z",
        revisionModifiedBy: user,
        revisionModifiedOn: "2024-01-24T15:28:31.263Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T15:28:31.263Z",
        savedBy: user,
        savedOn: "2024-01-24T15:28:31.263Z",
        status: "published",
        tenant: "root",
        TYPE: "cms.entry",
        values: {
            "json@triggers": null,
            "object@fields": [
                {
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@options": [],
                    "object@validation": [],
                    "text@fieldId": "demoField",
                    "text@helpText": null,
                    "text@label": "Demo Field",
                    "text@name": "text",
                    "text@placeholderText": null,
                    "text@type": "text",
                    "text@_id": "Pr3Pj3w2zO"
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
                    "json@layout": [["Pr3Pj3w2zO"]],
                    "text@title": "Step 1"
                }
            ],
            "text@formId": "65b12c8ecd6a580008f2fa31",
            "text@name": "Demo Form 1",
            "text@slug": "demo-form-1-65b12c8ecd6a580008f2fa31"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#CME#65b12c8ecd6a580008f2fa31",
        SK: "REV#0002",
        createdBy: user,
        createdOn: "2024-01-24T15:28:14.710Z",
        entryId: "65b12c8ecd6a580008f2fa31",
        firstPublishedBy: user,
        firstPublishedOn: "2024-01-24T15:28:31.263Z",
        GSI1_PK: "T#root#L#en-US#CMS#CME#M#fbForm#A",
        GSI1_SK: "65b12c8ecd6a580008f2fa31#0002",
        id: "65b12c8ecd6a580008f2fa31#0002",
        lastPublishedBy: user,
        lastPublishedOn: "2024-01-24T15:28:31.263Z",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        meta: {},
        modelId: "fbForm",
        modifiedBy: user,
        modifiedOn: "2024-01-24T15:28:41.543Z",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T15:28:37.723Z",
        revisionModifiedBy: user,
        revisionModifiedOn: "2024-01-24T15:28:41.543Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T15:28:41.543Z",
        savedBy: user,
        savedOn: "2024-01-24T15:28:41.543Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry",
        values: {
            "json@triggers": null,
            "object@fields": [
                {
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@options": [],
                    "object@validation": [
                        {
                            "json@settings": {},
                            "text@message": "Value is required.",
                            "text@name": "required"
                        }
                    ],
                    "text@fieldId": "demoField",
                    "text@helpText": null,
                    "text@label": "Demo Field",
                    "text@name": "text",
                    "text@placeholderText": null,
                    "text@type": "text",
                    "text@_id": "Pr3Pj3w2zO"
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
                    "json@layout": [["Pr3Pj3w2zO"]],
                    "text@title": "Step 1"
                }
            ],
            "text@formId": "65b12c8ecd6a580008f2fa31",
            "text@name": "Demo Form 1",
            "text@slug": "demo-form-1-65b12c8ecd6a580008f2fa31"
        },
        version: 2,
        webinyVersion: "0.0.0"
    },

    // Form with 1 draft revision
    {
        PK: "T#root#L#en-US#CMS#CME#CME#65b139b15cb71f0008718ac9",
        SK: "L",
        createdBy: user,
        createdOn: "2024-01-24T16:24:17.185Z",
        entryId: "65b139b15cb71f0008718ac9",
        GSI1_PK: "T#root#L#en-US#CMS#CME#M#fbForm#L",
        GSI1_SK: "65b139b15cb71f0008718ac9#0001",
        id: "65b139b15cb71f0008718ac9#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        meta: {},
        modelId: "fbForm",
        modifiedBy: user,
        modifiedOn: "2024-01-24T16:24:34.090Z",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T16:24:17.185Z",
        revisionModifiedBy: user,
        revisionModifiedOn: "2024-01-24T16:24:34.090Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T16:24:34.090Z",
        savedBy: user,
        savedOn: "2024-01-24T16:24:34.090Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry.l",
        values: {
            "json@triggers": null,
            "object@fields": [
                {
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@validation": [],
                    "object@options": [],
                    "text@fieldId": "demoField",
                    "text@helpText": null,
                    "text@label": "Demo Field",
                    "text@name": "text",
                    "text@placeholderText": null,
                    "text@type": "text",
                    "text@_id": "kpBvlR4SjU"
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
                    "json@layout": [["kpBvlR4SjU"]],
                    "text@title": "Step 1"
                }
            ],
            "text@formId": "65b139b15cb71f0008718ac9",
            "text@name": "Demo form 2",
            "text@slug": "demo-form-2-65b139b15cb71f0008718ac9"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#CME#65b139b15cb71f0008718ac9",
        SK: "REV#0001",
        createdBy: user,
        createdOn: "2024-01-24T16:24:17.185Z",
        entryId: "65b139b15cb71f0008718ac9",
        GSI1_PK: "T#root#L#en-US#CMS#CME#M#fbForm#A",
        GSI1_SK: "65b139b15cb71f0008718ac9#0001",
        id: "65b139b15cb71f0008718ac9#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        meta: {},
        modelId: "fbForm",
        modifiedBy: user,
        modifiedOn: "2024-01-24T16:24:34.090Z",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T16:24:17.185Z",
        revisionModifiedBy: user,
        revisionModifiedOn: "2024-01-24T16:24:34.090Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T16:24:34.090Z",
        savedBy: user,
        savedOn: "2024-01-24T16:24:34.090Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry",
        values: {
            "json@triggers": null,
            "object@fields": [
                {
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@options": [],
                    "object@validation": [],
                    "text@fieldId": "demoField",
                    "text@helpText": null,
                    "text@label": "Demo Field",
                    "text@name": "text",
                    "text@placeholderText": null,
                    "text@type": "text",
                    "text@_id": "kpBvlR4SjU"
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
                    "json@layout": [["kpBvlR4SjU"]],
                    "text@title": "Step 1"
                }
            ],
            "text@formId": "65b139b15cb71f0008718ac9",
            "text@name": "Demo form 2",
            "text@slug": "demo-form-2-65b139b15cb71f0008718ac9"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },

    // Form with 4 revisions: 1° published, 2° published, 3° unpublished, 4° draft
    {
        PK: "T#root#L#en-US#CMS#CME#CME#65b14a9982c87000081f93b3",
        SK: "L",
        createdBy: user,
        createdOn: "2024-01-24T17:36:25.519Z",
        entryId: "65b14a9982c87000081f93b3",
        firstPublishedBy: user,
        firstPublishedOn: "2024-01-24T17:37:13.678Z",
        GSI1_PK: "T#root#L#en-US#CMS#CME#M#fbForm#L",
        GSI1_SK: "65b14a9982c87000081f93b3#0004",
        id: "65b14a9982c87000081f93b3#0004",
        lastPublishedBy: user,
        lastPublishedOn: "2024-01-24T17:37:13.678Z",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        meta: {},
        modelId: "fbForm",
        modifiedBy: user,
        modifiedOn: "2024-01-24T17:39:11.428Z",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T17:39:11.428Z",
        revisionModifiedBy: user,
        revisionModifiedOn: "2024-01-24T17:39:11.428Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T17:39:11.428Z",
        savedBy: user,
        savedOn: "2024-01-24T17:39:11.428Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry.l",
        values: {
            "json@triggers": null,
            "object@fields": [
                {
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@validation": [],
                    "object@options": [],
                    "text@fieldId": "demoField",
                    "text@helpText": null,
                    "text@label": "Demo Field",
                    "text@name": "text",
                    "text@placeholderText": null,
                    "text@type": "text",
                    "text@_id": "VLGQV3Wx-o"
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
                    "json@layout": [["VLGQV3Wx-o"]],
                    "text@title": "Step 1"
                }
            ],
            "text@formId": "65b14a9982c87000081f93b3",
            "text@name": "Demo Form 3",
            "text@slug": "demo-form-3-65b14a9982c87000081f93b3"
        },
        version: 4,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#CME#65b14a9982c87000081f93b3",
        SK: "P",
        createdBy: user,
        createdOn: "2024-01-24T17:36:25.519Z",
        entryId: "65b14a9982c87000081f93b3",
        firstPublishedBy: user,
        firstPublishedOn: "2024-01-24T17:37:13.678Z",
        GSI1_PK: "T#root#L#en-US#CMS#CME#M#fbForm#P",
        GSI1_SK: "65b14a9982c87000081f93b3#0002",
        id: "65b14a9982c87000081f93b3#0002",
        lastPublishedBy: user,
        lastPublishedOn: "2024-01-24T17:37:13.678Z",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: true,
        meta: {},
        modelId: "fbForm",
        modifiedBy: user,
        modifiedOn: "2024-01-24T17:37:13.678Z",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T17:37:08.943Z",
        revisionFirstPublishedBy: user,
        revisionFirstPublishedOn: "2024-01-24T17:37:13.678Z",
        revisionLastPublishedBy: user,
        revisionLastPublishedOn: "2024-01-24T17:37:13.678Z",
        revisionModifiedBy: user,
        revisionModifiedOn: "2024-01-24T17:37:13.678Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T17:37:13.678Z",
        savedBy: user,
        savedOn: "2024-01-24T17:37:13.678Z",
        status: "published",
        tenant: "root",
        TYPE: "cms.entry.p",
        values: {
            "json@triggers": null,
            "object@fields": [
                {
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@options": [],
                    "object@validation": [],
                    "text@fieldId": "demoField",
                    "text@helpText": null,
                    "text@label": "Demo Field",
                    "text@name": "text",
                    "text@placeholderText": null,
                    "text@type": "text",
                    "text@_id": "VLGQV3Wx-o"
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
                    "json@layout": [["VLGQV3Wx-o"]],
                    "text@title": "Step 1"
                }
            ],
            "text@formId": "65b14a9982c87000081f93b3",
            "text@name": "Demo Form 3",
            "text@slug": "demo-form-3-65b14a9982c87000081f93b3"
        },
        version: 2,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#CME#65b14a9982c87000081f93b3",
        SK: "REV#0001",
        createdBy: user,
        createdOn: "2024-01-24T17:36:25.519Z",
        entryId: "65b14a9982c87000081f93b3",
        firstPublishedBy: user,
        firstPublishedOn: "2024-01-24T17:37:13.678Z",
        GSI1_PK: "T#root#L#en-US#CMS#CME#M#fbForm#A",
        GSI1_SK: "65b14a9982c87000081f93b3#0001",
        id: "65b14a9982c87000081f93b3#0001",
        lastPublishedBy: user,
        lastPublishedOn: "2024-01-24T17:37:13.678Z",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: true,
        meta: {},
        modelId: "fbForm",
        modifiedBy: user,
        modifiedOn: "2024-01-24T17:36:45.577Z",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T17:36:25.519Z",
        revisionFirstPublishedBy: user,
        revisionFirstPublishedOn: "2024-01-24T17:37:13.678Z",
        revisionLastPublishedBy: user,
        revisionLastPublishedOn: "2024-01-24T17:37:13.678Z",
        revisionModifiedBy: user,
        revisionModifiedOn: "2024-01-24T17:36:45.577Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T17:36:45.577Z",
        savedBy: user,
        savedOn: "2024-01-24T17:36:45.577Z",
        status: "unpublished",
        tenant: "root",
        TYPE: "cms.entry",
        values: {
            "json@triggers": null,
            "object@fields": [
                {
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@options": [],
                    "object@validation": [],
                    "text@fieldId": "demoField",
                    "text@helpText": null,
                    "text@label": "Demo Field",
                    "text@name": "text",
                    "text@placeholderText": null,
                    "text@type": "text",
                    "text@_id": "VLGQV3Wx-o"
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
                    "json@layout": [["VLGQV3Wx-o"]],
                    "text@title": "Step 1"
                }
            ],
            "text@formId": "65b14a9982c87000081f93b3",
            "text@name": "Demo Form 3",
            "text@slug": "demo-form-3-65b14a9982c87000081f93b3"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#CME#65b14a9982c87000081f93b3",
        SK: "REV#0002",
        createdBy: user,
        createdOn: "2024-01-24T17:36:25.519Z",
        entryId: "65b14a9982c87000081f93b3",
        firstPublishedBy: user,
        firstPublishedOn: "2024-01-24T17:37:13.678Z",
        GSI1_PK: "T#root#L#en-US#CMS#CME#M#fbForm#A",
        GSI1_SK: "65b14a9982c87000081f93b3#0002",
        id: "65b14a9982c87000081f93b3#0002",
        lastPublishedBy: user,
        lastPublishedOn: "2024-01-24T17:37:13.678Z",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: true,
        meta: {},
        modelId: "fbForm",
        modifiedBy: user,
        modifiedOn: "2024-01-24T17:37:13.678Z",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T17:37:08.943Z",
        revisionFirstPublishedBy: user,
        revisionFirstPublishedOn: "2024-01-24T17:37:13.678Z",
        revisionLastPublishedBy: user,
        revisionLastPublishedOn: "2024-01-24T17:37:13.678Z",
        revisionModifiedBy: user,
        revisionModifiedOn: "2024-01-24T17:37:13.678Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T17:37:13.678Z",
        savedBy: user,
        savedOn: "2024-01-24T17:37:13.678Z",
        status: "published",
        tenant: "root",
        TYPE: "cms.entry",
        values: {
            "json@triggers": null,
            "object@fields": [
                {
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@options": [],
                    "object@validation": [],
                    "text@fieldId": "demoField",
                    "text@helpText": null,
                    "text@label": "Demo Field",
                    "text@name": "text",
                    "text@placeholderText": null,
                    "text@type": "text",
                    "text@_id": "VLGQV3Wx-o"
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
                    "json@layout": [["VLGQV3Wx-o"]],
                    "text@title": "Step 1"
                }
            ],
            "text@formId": "65b14a9982c87000081f93b3",
            "text@name": "Demo Form 3",
            "text@slug": "demo-form-3-65b14a9982c87000081f93b3"
        },
        version: 2,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#CME#65b14a9982c87000081f93b3",
        SK: "REV#0003",
        createdBy: user,
        createdOn: "2024-01-24T17:36:25.519Z",
        entryId: "65b14a9982c87000081f93b3",
        firstPublishedBy: user,
        firstPublishedOn: "2024-01-24T17:37:13.678Z",
        GSI1_PK: "T#root#L#en-US#CMS#CME#M#fbForm#A",
        GSI1_SK: "65b14a9982c87000081f93b3#0003",
        id: "65b14a9982c87000081f93b3#0003",
        lastPublishedBy: user,
        lastPublishedOn: "2024-01-24T17:37:13.678Z",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: true,
        meta: {},
        modelId: "fbForm",
        modifiedBy: user,
        modifiedOn: "2024-01-24T17:39:26.457Z",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T17:38:28.497Z",
        revisionFirstPublishedBy: user,
        revisionFirstPublishedOn: "2024-01-24T17:37:13.678Z",
        revisionLastPublishedBy: user,
        revisionLastPublishedOn: "2024-01-24T17:37:13.678Z",
        revisionModifiedBy: user,
        revisionModifiedOn: "2024-01-24T17:39:26.457Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T17:39:26.457Z",
        savedBy: user,
        savedOn: "2024-01-24T17:39:26.457Z",
        status: "unpublished",
        tenant: "root",
        TYPE: "cms.entry",
        values: {
            "json@triggers": null,
            "object@fields": [
                {
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@options": [],
                    "object@validation": [],
                    "text@fieldId": "demoField",
                    "text@helpText": null,
                    "text@label": "Demo Field",
                    "text@name": "text",
                    "text@type": "text",
                    "text@placeholderText": null,
                    "text@_id": "VLGQV3Wx-o"
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
                    "json@layout": [["VLGQV3Wx-o"]],
                    "text@title": "Step 1"
                }
            ],
            "text@formId": "65b14a9982c87000081f93b3",
            "text@name": "Demo Form 3",
            "text@slug": "demo-form-3-65b14a9982c87000081f93b3"
        },
        version: 3,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#CME#65b14a9982c87000081f93b3",
        SK: "REV#0004",
        createdBy: user,
        createdOn: "2024-01-24T17:36:25.519Z",
        entryId: "65b14a9982c87000081f93b3",
        firstPublishedBy: user,
        firstPublishedOn: "2024-01-24T17:37:13.678Z",
        GSI1_PK: "T#root#L#en-US#CMS#CME#M#fbForm#A",
        GSI1_SK: "65b14a9982c87000081f93b3#0004",
        id: "65b14a9982c87000081f93b3#0004",
        lastPublishedBy: user,
        lastPublishedOn: "2024-01-24T17:37:13.678Z",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        meta: {},
        modelId: "fbForm",
        modifiedBy: user,
        modifiedOn: "2024-01-24T17:39:11.428Z",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T17:39:11.428Z",
        revisionModifiedBy: user,
        revisionModifiedOn: "2024-01-24T17:39:11.428Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T17:39:11.428Z",
        savedBy: user,
        savedOn: "2024-01-24T17:39:11.428Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry",
        values: {
            "json@triggers": null,
            "object@fields": [
                {
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@options": [],
                    "object@validation": [],
                    "text@fieldId": "demoField",
                    "text@helpText": null,
                    "text@label": "Demo Field",
                    "text@name": "text",
                    "text@placeholderText": null,
                    "text@type": "text",
                    "text@_id": "VLGQV3Wx-o"
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
                    "json@layout": [["VLGQV3Wx-o"]],
                    "text@title": "Step 1"
                }
            ],
            "text@formId": "65b14a9982c87000081f93b3",
            "text@name": "Demo Form 3",
            "text@slug": "demo-form-3-65b14a9982c87000081f93b3"
        },
        version: 4,
        webinyVersion: "0.0.0"
    },

    // Form with contact fields, required, organised in 2 steps
    {
        PK: "T#root#L#en-US#CMS#CME#CME#65b16a8d7918760008c0ea56",
        SK: "L",
        createdBy: user,
        createdOn: "2024-01-24T19:52:45.637Z",
        entryId: "65b16a8d7918760008c0ea56",
        GSI1_PK: "T#root#L#en-US#CMS#CME#M#fbForm#L",
        GSI1_SK: "65b16a8d7918760008c0ea56#0001",
        id: "65b16a8d7918760008c0ea56#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        meta: {},
        modelId: "fbForm",
        modifiedBy: user,
        modifiedOn: "2024-01-24T19:53:54.458Z",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T19:52:45.637Z",
        revisionModifiedBy: user,
        revisionModifiedOn: "2024-01-24T19:53:54.458Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T19:53:54.458Z",
        savedBy: user,
        savedOn: "2024-01-24T19:53:54.458Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry.l",
        values: {
            "json@triggers": null,
            "object@fields": [
                {
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@options": [],
                    "object@validation": [
                        {
                            "json@settings": {},
                            "text@message": "Value is required.",
                            "text@name": "required"
                        }
                    ],
                    "text@fieldId": "firstName",
                    "text@label": "First name",
                    "text@name": "firstName",
                    "text@helpText": null,
                    "text@placeholderText": null,
                    "text@type": "text",
                    "text@_id": "wKBpJ6lq0"
                },
                {
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@validation": [
                        {
                            "json@settings": {},
                            "text@message": "Value is required.",
                            "text@name": "required"
                        }
                    ],
                    "object@options": [],
                    "text@fieldId": "lastName",
                    "text@helpText": null,
                    "text@label": "Last name",
                    "text@name": "lastName",
                    "text@type": "text",
                    "text@placeholderText": null,
                    "text@_id": "ylPaYyVaM"
                },
                {
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@validation": [
                        {
                            "json@settings": {
                                flags: null,
                                preset: "email",
                                regex: null
                            },
                            "text@message": "Please enter a valid e-mail.",
                            "text@name": "pattern"
                        },
                        {
                            "json@settings": {},
                            "text@message": "Value is required.",
                            "text@name": "required"
                        }
                    ],
                    "text@fieldId": "email",
                    "text@label": "Email",
                    "text@name": "email",
                    "text@type": "text",
                    "text@_id": "u1miDVk2r",
                    "object@options": [],
                    "text@helpText": null,
                    "text@placeholderText": null
                },
                {
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@validation": [
                        {
                            "json@settings": {},
                            "text@message": "Value is required.",
                            "text@name": "required"
                        }
                    ],
                    "text@fieldId": "phoneNumber",
                    "text@label": "Phone number",
                    "text@name": "phoneNumber",
                    "text@type": "text",
                    "text@_id": "54ED5X_p6",
                    "object@options": [],
                    "text@helpText": null,
                    "text@placeholderText": null
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
                    "json@layout": [["wKBpJ6lq0"], ["ylPaYyVaM"]],
                    "text@title": "Step 1"
                },
                {
                    "json@layout": [["u1miDVk2r"], ["54ED5X_p6"]],
                    "text@title": "New Step"
                }
            ],
            "text@formId": "65b16a8d7918760008c0ea56",
            "text@name": "Demo Form 4",
            "text@slug": "demo-form-4-65b16a8d7918760008c0ea56"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#CME#65b16a8d7918760008c0ea56",
        SK: "REV#0001",
        createdBy: user,
        createdOn: "2024-01-24T19:52:45.637Z",
        entryId: "65b16a8d7918760008c0ea56",
        GSI1_PK: "T#root#L#en-US#CMS#CME#M#fbForm#A",
        GSI1_SK: "65b16a8d7918760008c0ea56#0001",
        id: "65b16a8d7918760008c0ea56#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        meta: {},
        modelId: "fbForm",
        modifiedBy: user,
        modifiedOn: "2024-01-24T19:53:54.458Z",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T19:52:45.637Z",
        revisionModifiedBy: user,
        revisionModifiedOn: "2024-01-24T19:53:54.458Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T19:53:54.458Z",
        savedBy: user,
        savedOn: "2024-01-24T19:53:54.458Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry",
        values: {
            "json@triggers": null,
            "object@fields": [
                {
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@validation": [
                        {
                            "json@settings": {},
                            "text@message": "Value is required.",
                            "text@name": "required"
                        }
                    ],
                    "text@fieldId": "firstName",
                    "text@label": "First name",
                    "text@name": "firstName",
                    "text@type": "text",
                    "text@_id": "wKBpJ6lq0",
                    "object@options": [],
                    "text@helpText": null,
                    "text@placeholderText": null
                },
                {
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@validation": [
                        {
                            "json@settings": {},
                            "text@message": "Value is required.",
                            "text@name": "required"
                        }
                    ],
                    "text@fieldId": "lastName",
                    "text@label": "Last name",
                    "text@name": "lastName",
                    "text@type": "text",
                    "text@_id": "ylPaYyVaM",
                    "object@options": [],
                    "text@helpText": null,
                    "text@placeholderText": null
                },
                {
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@validation": [
                        {
                            "json@settings": {
                                flags: null,
                                preset: "email",
                                regex: null
                            },
                            "text@message": "Please enter a valid e-mail.",
                            "text@name": "pattern"
                        },
                        {
                            "json@settings": {},
                            "text@message": "Value is required.",
                            "text@name": "required"
                        }
                    ],
                    "text@fieldId": "email",
                    "text@label": "Email",
                    "text@name": "email",
                    "text@type": "text",
                    "text@_id": "u1miDVk2r",
                    "object@options": [],
                    "text@helpText": null,
                    "text@placeholderText": null
                },
                {
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@validation": [
                        {
                            "json@settings": {},
                            "text@message": "Value is required.",
                            "text@name": "required"
                        }
                    ],
                    "text@fieldId": "phoneNumber",
                    "text@label": "Phone number",
                    "text@name": "phoneNumber",
                    "text@type": "text",
                    "text@_id": "54ED5X_p6",
                    "object@options": [],
                    "text@helpText": null,
                    "text@placeholderText": null
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
                    "json@layout": [["wKBpJ6lq0"], ["ylPaYyVaM"]],
                    "text@title": "Step 1"
                },
                {
                    "json@layout": [["u1miDVk2r"], ["54ED5X_p6"]],
                    "text@title": "New Step"
                }
            ],
            "text@formId": "65b16a8d7918760008c0ea56",
            "text@name": "Demo Form 4",
            "text@slug": "demo-form-4-65b16a8d7918760008c0ea56"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },

    // Form with default fields
    {
        PK: "T#root#L#en-US#CMS#CME#CME#65b189f16f69800008e6161b",
        SK: "L",
        createdBy: user,
        createdOn: "2024-01-24T22:06:41.291Z",
        entryId: "65b189f16f69800008e6161b",
        GSI1_PK: "T#root#L#en-US#CMS#CME#M#fbForm#L",
        GSI1_SK: "65b189f16f69800008e6161b#0001",
        id: "65b189f16f69800008e6161b#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        meta: {},
        modelId: "fbForm",
        modifiedBy: user,
        modifiedOn: "2024-01-24T22:13:12.913Z",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T22:06:41.291Z",
        revisionModifiedBy: user,
        revisionModifiedOn: "2024-01-24T22:13:12.913Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T22:13:12.913Z",
        savedBy: user,
        savedOn: "2024-01-24T22:13:12.913Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry.l",
        values: {
            "json@triggers": null,
            "object@fields": [
                {
                    "json@settings": {
                        defaultValue: "Hidden Field - Default Value"
                    },
                    "object@options": [],
                    "object@validation": [],
                    "text@fieldId": "hiddenField",
                    "text@helpText": "Hidden Field - Help Text",
                    "text@label": "Hidden Field",
                    "text@name": "hidden",
                    "text@placeholderText": null,
                    "text@type": "hidden",
                    "text@_id": "NZWPSHZRIN"
                },
                {
                    "json@settings": {
                        defaultValue: "option2"
                    },
                    "object@options": [
                        {
                            "text@label": "Option 1",
                            "text@value": "option1"
                        },
                        {
                            "text@label": "Option 2",
                            "text@value": "option2"
                        },
                        {
                            "text@label": "Option 3",
                            "text@value": "option3"
                        }
                    ],
                    "object@validation": [],
                    "text@fieldId": "selectField",
                    "text@helpText": "Select Field - Help Text",
                    "text@label": "Select Field",
                    "text@name": "select",
                    "text@placeholderText": "Select Field - Help Text",
                    "text@type": "select",
                    "text@_id": "vxI0OE-flE"
                },
                {
                    "json@settings": {
                        defaultValue: "Short Text - Default Value"
                    },
                    "object@options": [],
                    "object@validation": [
                        {
                            "json@settings": {
                                value: "1"
                            },
                            "text@message": "Value is too short.",
                            "text@name": "minLength"
                        },
                        {
                            "json@settings": {
                                value: "6"
                            },
                            "text@message": "Value is too long.",
                            "text@name": "maxLength"
                        }
                    ],
                    "text@fieldId": "shortText",
                    "text@helpText": "Short Text - Help Text",
                    "text@label": "Short Text",
                    "text@name": "text",
                    "text@placeholderText": "Short Text - Placeholder Text",
                    "text@type": "text",
                    "text@_id": "1om83kly5s"
                },
                {
                    "json@settings": {
                        defaultValue: "Long Text - Default Text",
                        rows: "10"
                    },
                    "object@options": [],
                    "object@validation": [],
                    "text@fieldId": "longText",
                    "text@helpText": "Long Text - Help Text",
                    "text@label": "Long Text",
                    "text@name": "textarea",
                    "text@placeholderText": "Long Text - Placeholder Text",
                    "text@type": "textarea",
                    "text@_id": "9L3Wgow6-b"
                },
                {
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@options": [],
                    "object@validation": [],
                    "text@fieldId": "numberField",
                    "text@helpText": "Number Field - Help Text",
                    "text@label": "Number Field",
                    "text@name": "number",
                    "text@placeholderText": "Number Field - Placeholder Text",
                    "text@type": "number",
                    "text@_id": "2gUedk4Aa1"
                },
                {
                    "json@settings": {
                        defaultValue: "option2",
                        otherOption: true
                    },
                    "object@options": [
                        {
                            "text@label": "Option 1",
                            "text@value": "option1"
                        },
                        {
                            "text@label": "Option 2",
                            "text@value": "option2"
                        },
                        {
                            "text@label": "Option 3",
                            "text@value": "option3"
                        }
                    ],
                    "object@validation": [],
                    "text@fieldId": "radioField",
                    "text@helpText": "Radio Field - Help Text",
                    "text@label": "Radio Field",
                    "text@name": "radio",
                    "text@placeholderText": null,
                    "text@type": "radio",
                    "text@_id": "tiR3t0uctA"
                },
                {
                    "json@settings": {
                        defaultValue: ["option3"],
                        otherOption: true
                    },
                    "object@options": [
                        {
                            "text@label": "Option 1",
                            "text@value": "option1"
                        },
                        {
                            "text@label": "Option 2",
                            "text@value": "option2"
                        },
                        {
                            "text@label": "Option 3",
                            "text@value": "option3"
                        }
                    ],
                    "object@validation": [],
                    "text@fieldId": "checkboxField",
                    "text@helpText": "Checkbox Field - Help Text",
                    "text@label": "Checkbox Field",
                    "text@name": "checkbox",
                    "text@placeholderText": null,
                    "text@type": "checkbox",
                    "text@_id": "W99qOcY4ie"
                },
                {
                    "json@settings": {
                        defaultValue: null,
                        format: "dateTimeWithTimezone"
                    },
                    "object@options": [],
                    "object@validation": [],
                    "text@fieldId": "dateTimeField",
                    "text@helpText": "DateTime Field - Help Text",
                    "text@label": "DateTime Field",
                    "text@name": "date",
                    "text@placeholderText": null,
                    "text@type": "datetime",
                    "text@_id": "1e542PkJHp"
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
                    "json@layout": [
                        ["NZWPSHZRIN"],
                        ["vxI0OE-flE"],
                        ["1om83kly5s", "9L3Wgow6-b"],
                        ["2gUedk4Aa1"],
                        ["tiR3t0uctA", "W99qOcY4ie"],
                        ["1e542PkJHp"]
                    ],
                    "text@title": "Step 1"
                }
            ],
            "text@formId": "65b189f16f69800008e6161b",
            "text@name": "Demo Form 5",
            "text@slug": "demo-form-5-65b189f16f69800008e6161b"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#CME#65b189f16f69800008e6161b",
        SK: "REV#0001",
        createdBy: user,
        createdOn: "2024-01-24T22:06:41.291Z",
        entryId: "65b189f16f69800008e6161b",
        GSI1_PK: "T#root#L#en-US#CMS#CME#M#fbForm#A",
        GSI1_SK: "65b189f16f69800008e6161b#0001",
        id: "65b189f16f69800008e6161b#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        meta: {},
        modelId: "fbForm",
        modifiedBy: user,
        modifiedOn: "2024-01-24T22:13:12.913Z",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T22:06:41.291Z",
        revisionModifiedBy: user,
        revisionModifiedOn: "2024-01-24T22:13:12.913Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T22:13:12.913Z",
        savedBy: user,
        savedOn: "2024-01-24T22:13:12.913Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry",
        values: {
            "json@triggers": null,
            "object@fields": [
                {
                    "json@settings": {
                        defaultValue: "Hidden Field - Default Value"
                    },
                    "object@options": [],
                    "object@validation": [],
                    "text@fieldId": "hiddenField",
                    "text@helpText": "Hidden Field - Help Text",
                    "text@label": "Hidden Field",
                    "text@name": "hidden",
                    "text@placeholderText": null,
                    "text@type": "hidden",
                    "text@_id": "NZWPSHZRIN"
                },
                {
                    "json@settings": {
                        defaultValue: "option2"
                    },
                    "object@options": [
                        {
                            "text@label": "Option 1",
                            "text@value": "option1"
                        },
                        {
                            "text@label": "Option 2",
                            "text@value": "option2"
                        },
                        {
                            "text@label": "Option 3",
                            "text@value": "option3"
                        }
                    ],
                    "object@validation": [],
                    "text@fieldId": "selectField",
                    "text@helpText": "Select Field - Help Text",
                    "text@label": "Select Field",
                    "text@name": "select",
                    "text@placeholderText": "Select Field - Help Text",
                    "text@type": "select",
                    "text@_id": "vxI0OE-flE"
                },
                {
                    "json@settings": {
                        defaultValue: "Short Text - Default Value"
                    },
                    "object@options": [],
                    "object@validation": [
                        {
                            "json@settings": {
                                value: "1"
                            },
                            "text@message": "Value is too short.",
                            "text@name": "minLength"
                        },
                        {
                            "json@settings": {
                                value: "6"
                            },
                            "text@message": "Value is too long.",
                            "text@name": "maxLength"
                        }
                    ],
                    "text@fieldId": "shortText",
                    "text@helpText": "Short Text - Help Text",
                    "text@label": "Short Text",
                    "text@name": "text",
                    "text@placeholderText": "Short Text - Placeholder Text",
                    "text@type": "text",
                    "text@_id": "1om83kly5s"
                },
                {
                    "json@settings": {
                        defaultValue: "Long Text - Default Text",
                        rows: "10"
                    },
                    "object@options": [],
                    "object@validation": [],
                    "text@fieldId": "longText",
                    "text@helpText": "Long Text - Help Text",
                    "text@label": "Long Text",
                    "text@name": "textarea",
                    "text@placeholderText": "Long Text - Placeholder Text",
                    "text@type": "textarea",
                    "text@_id": "9L3Wgow6-b"
                },
                {
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@options": [],
                    "object@validation": [],
                    "text@fieldId": "numberField",
                    "text@helpText": "Number Field - Help Text",
                    "text@label": "Number Field",
                    "text@name": "number",
                    "text@placeholderText": "Number Field - Placeholder Text",
                    "text@type": "number",
                    "text@_id": "2gUedk4Aa1"
                },
                {
                    "json@settings": {
                        defaultValue: "option2",
                        otherOption: true
                    },
                    "object@options": [
                        {
                            "text@label": "Option 1",
                            "text@value": "option1"
                        },
                        {
                            "text@label": "Option 2",
                            "text@value": "option2"
                        },
                        {
                            "text@label": "Option 3",
                            "text@value": "option3"
                        }
                    ],
                    "object@validation": [],
                    "text@fieldId": "radioField",
                    "text@helpText": "Radio Field - Help Text",
                    "text@label": "Radio Field",
                    "text@name": "radio",
                    "text@placeholderText": null,
                    "text@type": "radio",
                    "text@_id": "tiR3t0uctA"
                },
                {
                    "json@settings": {
                        defaultValue: ["option3"],
                        otherOption: true
                    },
                    "object@options": [
                        {
                            "text@label": "Option 1",
                            "text@value": "option1"
                        },
                        {
                            "text@label": "Option 2",
                            "text@value": "option2"
                        },
                        {
                            "text@label": "Option 3",
                            "text@value": "option3"
                        }
                    ],
                    "object@validation": [],
                    "text@fieldId": "checkboxField",
                    "text@helpText": "Checkbox Field - Help Text",
                    "text@label": "Checkbox Field",
                    "text@name": "checkbox",
                    "text@placeholderText": null,
                    "text@type": "checkbox",
                    "text@_id": "W99qOcY4ie"
                },
                {
                    "json@settings": {
                        defaultValue: null,
                        format: "dateTimeWithTimezone"
                    },
                    "object@options": [],
                    "object@validation": [],
                    "text@fieldId": "dateTimeField",
                    "text@helpText": "DateTime Field - Help Text",
                    "text@label": "DateTime Field",
                    "text@name": "date",
                    "text@placeholderText": null,
                    "text@type": "datetime",
                    "text@_id": "1e542PkJHp"
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
                    "json@layout": [
                        ["NZWPSHZRIN"],
                        ["vxI0OE-flE"],
                        ["1om83kly5s", "9L3Wgow6-b"],
                        ["2gUedk4Aa1"],
                        ["tiR3t0uctA", "W99qOcY4ie"],
                        ["1e542PkJHp"]
                    ],
                    "text@title": "Step 1"
                }
            ],
            "text@formId": "65b189f16f69800008e6161b",
            "text@name": "Demo Form 5",
            "text@slug": "demo-form-5-65b189f16f69800008e6161b"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },

    // Form with custom settings
    {
        PK: "T#root#L#en-US#CMS#CME#CME#65b18df865a46200087864f9",
        SK: "L",
        createdBy: user,
        createdOn: "2024-01-24T22:23:52.364Z",
        entryId: "65b18df865a46200087864f9",
        GSI1_PK: "T#root#L#en-US#CMS#CME#M#fbForm#L",
        GSI1_SK: "65b18df865a46200087864f9#0001",
        id: "65b18df865a46200087864f9#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        meta: {},
        modelId: "fbForm",
        modifiedBy: user,
        modifiedOn: "2024-01-24T22:26:03.138Z",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T22:23:52.364Z",
        revisionModifiedBy: user,
        revisionModifiedOn: "2024-01-24T22:26:03.138Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T22:26:03.138Z",
        savedBy: user,
        savedOn: "2024-01-24T22:26:03.138Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry.l",
        values: {
            "json@triggers": null,
            "object@fields": [
                {
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@options": [],
                    "object@validation": [],
                    "text@fieldId": "demoField",
                    "text@helpText": null,
                    "text@label": "Demo Field",
                    "text@name": "text",
                    "text@placeholderText": null,
                    "text@type": "text",
                    "text@_id": "dMWqYyLYQV"
                }
            ],
            "object@settings": {
                "boolean@fullWidthSubmitButton": true,
                "json@successMessage": [
                    {
                        data: {
                            className: null,
                            text: "Custom success message",
                            textAlign: "start"
                        },
                        id: "fjiaYeH_wW",
                        type: "paragraph"
                    }
                ],
                "object@layout": {
                    "text@renderer": "default"
                },
                "object@reCaptcha": {
                    "boolean@enabled": true,
                    "text@errorMessage": "Custom Captcha error message"
                },
                "object@termsOfServiceMessage": {
                    "boolean@enabled": true,
                    "json@message": [
                        {
                            data: {
                                className: null,
                                text: "Custom term of service message",
                                textAlign: "start"
                            },
                            id: "kjBMY6NBnA",
                            type: "paragraph"
                        }
                    ],
                    "text@errorMessage": "Custom error message"
                },
                "text@submitButtonLabel": "Custom submit button label"
            },
            "object@steps": [
                {
                    "json@layout": [["dMWqYyLYQV"]],
                    "text@title": "Step 1"
                }
            ],
            "text@formId": "65b18df865a46200087864f9",
            "text@name": "Demo Form 6",
            "text@slug": "demo-form-6-65b18df865a46200087864f9"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#CME#65b18df865a46200087864f9",
        SK: "REV#0001",
        createdBy: user,
        createdOn: "2024-01-24T22:23:52.364Z",
        entryId: "65b18df865a46200087864f9",
        GSI1_PK: "T#root#L#en-US#CMS#CME#M#fbForm#A",
        GSI1_SK: "65b18df865a46200087864f9#0001",
        id: "65b18df865a46200087864f9#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        meta: {},
        modelId: "fbForm",
        modifiedBy: user,
        modifiedOn: "2024-01-24T22:26:03.138Z",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T22:23:52.364Z",
        revisionModifiedBy: user,
        revisionModifiedOn: "2024-01-24T22:26:03.138Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T22:26:03.138Z",
        savedBy: user,
        savedOn: "2024-01-24T22:26:03.138Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry",
        values: {
            "json@triggers": null,
            "object@fields": [
                {
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@options": [],
                    "object@validation": [],
                    "text@fieldId": "demoField",
                    "text@helpText": null,
                    "text@label": "Demo Field",
                    "text@name": "text",
                    "text@placeholderText": null,
                    "text@type": "text",
                    "text@_id": "dMWqYyLYQV"
                }
            ],
            "object@settings": {
                "boolean@fullWidthSubmitButton": true,
                "json@successMessage": [
                    {
                        data: {
                            className: null,
                            text: "Custom success message",
                            textAlign: "start"
                        },
                        id: "fjiaYeH_wW",
                        type: "paragraph"
                    }
                ],
                "object@layout": {
                    "text@renderer": "default"
                },
                "object@reCaptcha": {
                    "boolean@enabled": true,
                    "text@errorMessage": "Custom Captcha error message"
                },
                "object@termsOfServiceMessage": {
                    "boolean@enabled": true,
                    "json@message": [
                        {
                            data: {
                                className: null,
                                text: "Custom term of service message",
                                textAlign: "start"
                            },
                            id: "kjBMY6NBnA",
                            type: "paragraph"
                        }
                    ],
                    "text@errorMessage": "Custom error message"
                },
                "text@submitButtonLabel": "Custom submit button label"
            },
            "object@steps": [
                {
                    "json@layout": [["dMWqYyLYQV"]],
                    "text@title": "Step 1"
                }
            ],
            "text@formId": "65b18df865a46200087864f9",
            "text@name": "Demo Form 6",
            "text@slug": "demo-form-6-65b18df865a46200087864f9"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },

    // Form 1 from root tenant, locale de-DE
    {
        PK: "T#root#L#de-DE#CMS#CME#CME#65b190cad481d800089f2479",
        SK: "L",
        createdBy: user,
        createdOn: "2024-01-24T22:35:54.384Z",
        entryId: "65b190cad481d800089f2479",
        firstPublishedBy: user,
        firstPublishedOn: "2024-01-24T22:36:12.348Z",
        GSI1_PK: "T#root#L#de-DE#CMS#CME#M#fbForm#L",
        GSI1_SK: "65b190cad481d800089f2479#0001",
        id: "65b190cad481d800089f2479#0001",
        lastPublishedBy: user,
        lastPublishedOn: "2024-01-24T22:36:12.348Z",
        locale: "de-DE",
        location: {
            folderId: "root"
        },
        locked: true,
        meta: {},
        modelId: "fbForm",
        modifiedBy: user,
        modifiedOn: "2024-01-24T22:36:12.348Z",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T22:35:54.384Z",
        revisionFirstPublishedBy: user,
        revisionFirstPublishedOn: "2024-01-24T22:36:12.348Z",
        revisionLastPublishedBy: user,
        revisionLastPublishedOn: "2024-01-24T22:36:12.348Z",
        revisionModifiedBy: user,
        revisionModifiedOn: "2024-01-24T22:36:12.348Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T22:36:12.348Z",
        savedBy: user,
        savedOn: "2024-01-24T22:36:12.348Z",
        status: "published",
        tenant: "root",
        TYPE: "cms.entry.l",
        values: {
            "json@triggers": null,
            "object@fields": [
                {
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@options": [],
                    "object@validation": [
                        {
                            "json@settings": {},
                            "text@message": "Value is required.",
                            "text@name": "required"
                        }
                    ],
                    "text@fieldId": "demoField",
                    "text@helpText": null,
                    "text@label": "Demo Field",
                    "text@name": "text",
                    "text@placeholderText": null,
                    "text@type": "text",
                    "text@_id": "dV3wx0ForO"
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
                    "json@layout": [["dV3wx0ForO"]],
                    "text@title": "Step 1"
                }
            ],
            "text@formId": "65b190cad481d800089f2479",
            "text@name": "Demo Form 7",
            "text@slug": "demo-form-7-65b190cad481d800089f2479"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#de-DE#CMS#CME#CME#65b190cad481d800089f2479",
        SK: "P",
        createdBy: user,
        createdOn: "2024-01-24T22:35:54.384Z",
        entryId: "65b190cad481d800089f2479",
        firstPublishedBy: user,
        firstPublishedOn: "2024-01-24T22:36:12.348Z",
        GSI1_PK: "T#root#L#de-DE#CMS#CME#M#fbForm#P",
        GSI1_SK: "65b190cad481d800089f2479#0001",
        id: "65b190cad481d800089f2479#0001",
        lastPublishedBy: user,
        lastPublishedOn: "2024-01-24T22:36:12.348Z",
        locale: "de-DE",
        location: {
            folderId: "root"
        },
        locked: true,
        meta: {},
        modelId: "fbForm",
        modifiedBy: user,
        modifiedOn: "2024-01-24T22:36:12.348Z",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T22:35:54.384Z",
        revisionFirstPublishedBy: user,
        revisionFirstPublishedOn: "2024-01-24T22:36:12.348Z",
        revisionLastPublishedBy: user,
        revisionLastPublishedOn: "2024-01-24T22:36:12.348Z",
        revisionModifiedBy: user,
        revisionModifiedOn: "2024-01-24T22:36:12.348Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T22:36:12.348Z",
        savedBy: user,
        savedOn: "2024-01-24T22:36:12.348Z",
        status: "published",
        tenant: "root",
        TYPE: "cms.entry.p",
        values: {
            "json@triggers": null,
            "object@fields": [
                {
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@options": [],
                    "object@validation": [
                        {
                            "json@settings": {},
                            "text@message": "Value is required.",
                            "text@name": "required"
                        }
                    ],
                    "text@fieldId": "demoField",
                    "text@helpText": null,
                    "text@label": "Demo Field",
                    "text@name": "text",
                    "text@placeholderText": null,
                    "text@type": "text",
                    "text@_id": "dV3wx0ForO"
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
                    "json@layout": [["dV3wx0ForO"]],
                    "text@title": "Step 1"
                }
            ],
            "text@formId": "65b190cad481d800089f2479",
            "text@name": "Demo Form 7",
            "text@slug": "demo-form-7-65b190cad481d800089f2479"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#de-DE#CMS#CME#CME#65b190cad481d800089f2479",
        SK: "REV#0001",
        createdBy: user,
        createdOn: "2024-01-24T22:35:54.384Z",
        entryId: "65b190cad481d800089f2479",
        firstPublishedBy: user,
        firstPublishedOn: "2024-01-24T22:36:12.348Z",
        GSI1_PK: "T#root#L#de-DE#CMS#CME#M#fbForm#A",
        GSI1_SK: "65b190cad481d800089f2479#0001",
        id: "65b190cad481d800089f2479#0001",
        lastPublishedBy: user,
        lastPublishedOn: "2024-01-24T22:36:12.348Z",
        locale: "de-DE",
        location: {
            folderId: "root"
        },
        locked: true,
        meta: {},
        modelId: "fbForm",
        modifiedBy: user,
        modifiedOn: "2024-01-24T22:36:12.348Z",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T22:35:54.384Z",
        revisionFirstPublishedBy: user,
        revisionFirstPublishedOn: "2024-01-24T22:36:12.348Z",
        revisionLastPublishedBy: user,
        revisionLastPublishedOn: "2024-01-24T22:36:12.348Z",
        revisionModifiedBy: user,
        revisionModifiedOn: "2024-01-24T22:36:12.348Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T22:36:12.348Z",
        savedBy: user,
        savedOn: "2024-01-24T22:36:12.348Z",
        status: "published",
        tenant: "root",
        TYPE: "cms.entry",
        values: {
            "json@triggers": null,
            "object@fields": [
                {
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@options": [],
                    "object@validation": [
                        {
                            "json@settings": {},
                            "text@message": "Value is required.",
                            "text@name": "required"
                        }
                    ],
                    "text@fieldId": "demoField",
                    "text@helpText": null,
                    "text@label": "Demo Field",
                    "text@name": "text",
                    "text@placeholderText": null,
                    "text@type": "text",
                    "text@_id": "dV3wx0ForO"
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
                    "json@layout": [["dV3wx0ForO"]],
                    "text@title": "Step 1"
                }
            ],
            "text@formId": "65b190cad481d800089f2479",
            "text@name": "Demo Form 7",
            "text@slug": "demo-form-7-65b190cad481d800089f2479"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },

    // Form 1 from root tenant, locale fr-FR
    {
        PK: "T#root#L#fr-FR#CMS#CME#CME#65b19428b583b90008e7a3bc",
        SK: "L",
        createdBy: user,
        createdOn: "2024-01-24T22:50:16.158Z",
        entryId: "65b19428b583b90008e7a3bc",
        GSI1_PK: "T#root#L#fr-FR#CMS#CME#M#fbForm#L",
        GSI1_SK: "65b19428b583b90008e7a3bc#0001",
        id: "65b19428b583b90008e7a3bc#0001",
        locale: "fr-FR",
        location: {
            folderId: "root"
        },
        locked: false,
        meta: {},
        modelId: "fbForm",
        modifiedBy: user,
        modifiedOn: "2024-01-24T22:50:26.517Z",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T22:50:16.158Z",
        revisionModifiedBy: user,
        revisionModifiedOn: "2024-01-24T22:50:26.517Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T22:50:26.517Z",
        savedBy: user,
        savedOn: "2024-01-24T22:50:26.517Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry.l",
        values: {
            "json@triggers": null,
            "object@fields": [
                {
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@options": [],
                    "object@validation": [],
                    "text@fieldId": "demoField",
                    "text@helpText": null,
                    "text@label": "Demo Field",
                    "text@name": "text",
                    "text@placeholderText": null,
                    "text@type": "text",
                    "text@_id": "njnnUb42N6"
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
                    "json@layout": [["njnnUb42N6"]],
                    "text@title": "Step 1"
                }
            ],
            "text@formId": "65b19428b583b90008e7a3bc",
            "text@name": "Demo Form 8",
            "text@slug": "demo-form-8-65b19428b583b90008e7a3bc"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#fr-FR#CMS#CME#CME#65b19428b583b90008e7a3bc",
        SK: "REV#0001",
        createdBy: user,
        createdOn: "2024-01-24T22:50:16.158Z",
        entryId: "65b19428b583b90008e7a3bc",
        GSI1_PK: "T#root#L#fr-FR#CMS#CME#M#fbForm#A",
        GSI1_SK: "65b19428b583b90008e7a3bc#0001",
        id: "65b19428b583b90008e7a3bc#0001",
        locale: "fr-FR",
        location: {
            folderId: "root"
        },
        locked: false,
        meta: {},
        modelId: "fbForm",
        modifiedBy: user,
        modifiedOn: "2024-01-24T22:50:26.517Z",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T22:50:16.158Z",
        revisionModifiedBy: user,
        revisionModifiedOn: "2024-01-24T22:50:26.517Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T22:50:26.517Z",
        savedBy: user,
        savedOn: "2024-01-24T22:50:26.517Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry",
        values: {
            "json@triggers": null,
            "object@fields": [
                {
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@options": [],
                    "object@validation": [],
                    "text@fieldId": "demoField",
                    "text@helpText": null,
                    "text@label": "Demo Field",
                    "text@name": "text",
                    "text@placeholderText": null,
                    "text@type": "text",
                    "text@_id": "njnnUb42N6"
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
                    "json@layout": [["njnnUb42N6"]],
                    "text@title": "Step 1"
                }
            ],
            "text@formId": "65b19428b583b90008e7a3bc",
            "text@name": "Demo Form 8",
            "text@slug": "demo-form-8-65b19428b583b90008e7a3bc"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },

    // Form 2 from root tenant, locale de-DE
    {
        PK: "T#root#L#de-DE#CMS#CME#CME#65b2050e264766000809d7aa",
        SK: "L",
        createdBy: user,
        createdOn: "2024-01-25T06:51:58.036Z",
        entryId: "65b2050e264766000809d7aa",
        firstPublishedBy: user,
        firstPublishedOn: "2024-01-25T06:53:03.955Z",
        GSI1_PK: "T#root#L#de-DE#CMS#CME#M#fbForm#L",
        GSI1_SK: "65b2050e264766000809d7aa#0002",
        id: "65b2050e264766000809d7aa#0002",
        lastPublishedBy: user,
        lastPublishedOn: "2024-01-25T06:53:03.955Z",
        locale: "de-DE",
        location: {
            folderId: "root"
        },
        locked: true,
        meta: {},
        modelId: "fbForm",
        modifiedBy: user,
        modifiedOn: "2024-01-25T06:53:03.955Z",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-25T06:52:56.840Z",
        revisionFirstPublishedBy: user,
        revisionFirstPublishedOn: "2024-01-25T06:53:03.955Z",
        revisionLastPublishedBy: user,
        revisionLastPublishedOn: "2024-01-25T06:53:03.955Z",
        revisionModifiedBy: user,
        revisionModifiedOn: "2024-01-25T06:53:03.955Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-25T06:53:03.955Z",
        savedBy: user,
        savedOn: "2024-01-25T06:53:03.955Z",
        status: "published",
        tenant: "root",
        TYPE: "cms.entry.l",
        values: {
            "json@triggers": null,
            "object@fields": [
                {
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@options": [],
                    "object@validation": [
                        {
                            "json@settings": {},
                            "text@message": "Value is required.",
                            "text@name": "required"
                        }
                    ],
                    "text@fieldId": "demoField",
                    "text@helpText": null,
                    "text@label": "Demo Field",
                    "text@name": "text",
                    "text@placeholderText": null,
                    "text@type": "text",
                    "text@_id": "1vzUX-cmPP"
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
                    "json@layout": [["1vzUX-cmPP"]],
                    "text@title": "Step 1"
                }
            ],
            "text@formId": "65b2050e264766000809d7aa",
            "text@name": "Demo Form 9",
            "text@slug": "demo-form-9-65b2050e264766000809d7aa"
        },
        version: 2,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#de-DE#CMS#CME#CME#65b2050e264766000809d7aa",
        SK: "P",
        createdBy: user,
        createdOn: "2024-01-25T06:51:58.036Z",
        entryId: "65b2050e264766000809d7aa",
        firstPublishedBy: user,
        firstPublishedOn: "2024-01-25T06:53:03.955Z",
        GSI1_PK: "T#root#L#de-DE#CMS#CME#M#fbForm#P",
        GSI1_SK: "65b2050e264766000809d7aa#0002",
        id: "65b2050e264766000809d7aa#0002",
        lastPublishedBy: user,
        lastPublishedOn: "2024-01-25T06:53:03.955Z",
        locale: "de-DE",
        location: {
            folderId: "root"
        },
        locked: true,
        meta: {},
        modelId: "fbForm",
        modifiedBy: user,
        modifiedOn: "2024-01-25T06:53:03.955Z",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-25T06:52:56.840Z",
        revisionFirstPublishedBy: user,
        revisionFirstPublishedOn: "2024-01-25T06:53:03.955Z",
        revisionLastPublishedBy: user,
        revisionLastPublishedOn: "2024-01-25T06:53:03.955Z",
        revisionModifiedBy: user,
        revisionModifiedOn: "2024-01-25T06:53:03.955Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-25T06:53:03.955Z",
        savedBy: user,
        savedOn: "2024-01-25T06:53:03.955Z",
        status: "published",
        tenant: "root",
        TYPE: "cms.entry.p",
        values: {
            "json@triggers": null,
            "object@fields": [
                {
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@options": [],
                    "object@validation": [
                        {
                            "json@settings": {},
                            "text@message": "Value is required.",
                            "text@name": "required"
                        }
                    ],
                    "text@fieldId": "demoField",
                    "text@helpText": null,
                    "text@label": "Demo Field",
                    "text@name": "text",
                    "text@placeholderText": null,
                    "text@type": "text",
                    "text@_id": "1vzUX-cmPP"
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
                    "json@layout": [["1vzUX-cmPP"]],
                    "text@title": "Step 1"
                }
            ],
            "text@formId": "65b2050e264766000809d7aa",
            "text@name": "Demo Form 9",
            "text@slug": "demo-form-9-65b2050e264766000809d7aa"
        },
        version: 2,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#de-DE#CMS#CME#CME#65b2050e264766000809d7aa",
        SK: "REV#0001",
        createdBy: user,
        createdOn: "2024-01-25T06:51:58.036Z",
        entryId: "65b2050e264766000809d7aa",
        firstPublishedBy: user,
        firstPublishedOn: "2024-01-25T06:53:03.955Z",
        GSI1_PK: "T#root#L#de-DE#CMS#CME#M#fbForm#A",
        GSI1_SK: "65b2050e264766000809d7aa#0001",
        id: "65b2050e264766000809d7aa#0001",
        lastPublishedBy: user,
        lastPublishedOn: "2024-01-25T06:53:03.955Z",
        locale: "de-DE",
        location: {
            folderId: "root"
        },
        locked: true,
        meta: {},
        modelId: "fbForm",
        modifiedBy: user,
        modifiedOn: "2024-01-25T06:52:51.920Z",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-25T06:51:58.036Z",
        revisionFirstPublishedBy: user,
        revisionFirstPublishedOn: "2024-01-25T06:53:03.955Z",
        revisionLastPublishedBy: user,
        revisionLastPublishedOn: "2024-01-25T06:53:03.955Z",
        revisionModifiedBy: user,
        revisionModifiedOn: "2024-01-25T06:52:51.920Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-25T06:52:51.920Z",
        savedBy: user,
        savedOn: "2024-01-25T06:52:51.920Z",
        status: "unpublished",
        tenant: "root",
        TYPE: "cms.entry",
        values: {
            "json@triggers": null,
            "object@fields": [
                {
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@options": [],
                    "object@validation": [],
                    "text@fieldId": "demoField",
                    "text@label": "Demo Field",
                    "text@name": "text",
                    "text@type": "text",
                    "text@_id": "1vzUX-cmPP",
                    "text@helpText": null,
                    "text@placeholderText": null
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
                    "json@layout": [["1vzUX-cmPP"]],
                    "text@title": "Step 1"
                }
            ],
            "text@formId": "65b2050e264766000809d7aa",
            "text@name": "Demo Form 9",
            "text@slug": "demo-form-9-65b2050e264766000809d7aa"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#de-DE#CMS#CME#CME#65b2050e264766000809d7aa",
        SK: "REV#0002",
        createdBy: user,
        createdOn: "2024-01-25T06:51:58.036Z",
        entryId: "65b2050e264766000809d7aa",
        firstPublishedBy: user,
        firstPublishedOn: "2024-01-25T06:53:03.955Z",
        GSI1_PK: "T#root#L#de-DE#CMS#CME#M#fbForm#A",
        GSI1_SK: "65b2050e264766000809d7aa#0002",
        id: "65b2050e264766000809d7aa#0002",
        lastPublishedBy: user,
        lastPublishedOn: "2024-01-25T06:53:03.955Z",
        locale: "de-DE",
        location: {
            folderId: "root"
        },
        locked: true,
        meta: {},
        modelId: "fbForm",
        modifiedBy: user,
        modifiedOn: "2024-01-25T06:53:03.955Z",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-25T06:52:56.840Z",
        revisionFirstPublishedBy: user,
        revisionFirstPublishedOn: "2024-01-25T06:53:03.955Z",
        revisionLastPublishedBy: user,
        revisionLastPublishedOn: "2024-01-25T06:53:03.955Z",
        revisionModifiedBy: user,
        revisionModifiedOn: "2024-01-25T06:53:03.955Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-25T06:53:03.955Z",
        savedBy: user,
        savedOn: "2024-01-25T06:53:03.955Z",
        status: "published",
        tenant: "root",
        TYPE: "cms.entry",
        values: {
            "json@triggers": null,
            "object@fields": [
                {
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@options": [],
                    "object@validation": [
                        {
                            "json@settings": {},
                            "text@message": "Value is required.",
                            "text@name": "required"
                        }
                    ],
                    "text@fieldId": "demoField",
                    "text@helpText": null,
                    "text@label": "Demo Field",
                    "text@name": "text",
                    "text@placeholderText": null,
                    "text@type": "text",
                    "text@_id": "1vzUX-cmPP"
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
                    "json@layout": [["1vzUX-cmPP"]],
                    "text@title": "Step 1"
                }
            ],
            "text@formId": "65b2050e264766000809d7aa",
            "text@name": "Demo Form 9",
            "text@slug": "demo-form-9-65b2050e264766000809d7aa"
        },
        version: 2,
        webinyVersion: "0.0.0"
    },

    // Form 1 from otherTenant, locale fr-FR
    {
        PK: "T#otherTenant#L#fr-FR#CMS#CME#CME#65b20b8f0321db00083d35c1",
        SK: "L",
        createdBy: user,
        createdOn: "2024-01-25T07:19:43.219Z",
        entryId: "65b20b8f0321db00083d35c1",
        GSI1_PK: "T#otherTenant#L#fr-FR#CMS#CME#M#fbForm#L",
        GSI1_SK: "65b20b8f0321db00083d35c1#0001",
        id: "65b20b8f0321db00083d35c1#0001",
        locale: "fr-FR",
        location: {
            folderId: "root"
        },
        locked: false,
        meta: {},
        modelId: "fbForm",
        modifiedBy: user,
        modifiedOn: "2024-01-25T07:19:51.052Z",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-25T07:19:43.219Z",
        revisionModifiedBy: user,
        revisionModifiedOn: "2024-01-25T07:19:51.052Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-25T07:19:51.052Z",
        savedBy: user,
        savedOn: "2024-01-25T07:19:51.052Z",
        status: "draft",
        tenant: "otherTenant",
        TYPE: "cms.entry.l",
        values: {
            "json@triggers": null,
            "object@fields": [
                {
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@options": [],
                    "object@validation": [],
                    "text@fieldId": "demoField",
                    "text@helpText": null,
                    "text@label": "Demo Field",
                    "text@name": "text",
                    "text@placeholderText": null,
                    "text@type": "text",
                    "text@_id": "EBPeRi4u0Z"
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
                    "json@layout": [["EBPeRi4u0Z"]],
                    "text@title": "Step 1"
                }
            ],
            "text@formId": "65b20b8f0321db00083d35c1",
            "text@name": "Demo Form 10",
            "text@slug": "demo-form-10-65b20b8f0321db00083d35c1"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#otherTenant#L#fr-FR#CMS#CME#CME#65b20b8f0321db00083d35c1",
        SK: "REV#0001",
        createdBy: user,
        createdOn: "2024-01-25T07:19:43.219Z",
        entryId: "65b20b8f0321db00083d35c1",
        GSI1_PK: "T#otherTenant#L#fr-FR#CMS#CME#M#fbForm#A",
        GSI1_SK: "65b20b8f0321db00083d35c1#0001",
        id: "65b20b8f0321db00083d35c1#0001",
        locale: "fr-FR",
        location: {
            folderId: "root"
        },
        locked: false,
        meta: {},
        modelId: "fbForm",
        modifiedBy: user,
        modifiedOn: "2024-01-25T07:19:51.052Z",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-25T07:19:43.219Z",
        revisionModifiedBy: user,
        revisionModifiedOn: "2024-01-25T07:19:51.052Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-25T07:19:51.052Z",
        savedBy: user,
        savedOn: "2024-01-25T07:19:51.052Z",
        status: "draft",
        tenant: "otherTenant",
        TYPE: "cms.entry",
        values: {
            "json@triggers": null,
            "object@fields": [
                {
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@options": [],
                    "object@validation": [],
                    "text@fieldId": "demoField",
                    "text@helpText": null,
                    "text@label": "Demo Field",
                    "text@name": "text",
                    "text@placeholderText": null,
                    "text@type": "text",
                    "text@_id": "EBPeRi4u0Z"
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
                    "json@layout": [["EBPeRi4u0Z"]],
                    "text@title": "Step 1"
                }
            ],
            "text@formId": "65b20b8f0321db00083d35c1",
            "text@name": "Demo Form 10",
            "text@slug": "demo-form-10-65b20b8f0321db00083d35c1"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },

    // Form 2 from otherTenant, locale fr-FR
    {
        PK: "T#otherTenant#L#fr-FR#CMS#CME#CME#65b20bc00321db00083d35c9",
        SK: "L",
        createdBy: user,
        createdOn: "2024-01-25T07:20:32.550Z",
        entryId: "65b20bc00321db00083d35c9",
        firstPublishedBy: user,
        firstPublishedOn: "2024-01-25T07:20:49.543Z",
        GSI1_PK: "T#otherTenant#L#fr-FR#CMS#CME#M#fbForm#L",
        GSI1_SK: "65b20bc00321db00083d35c9#0001",
        id: "65b20bc00321db00083d35c9#0001",
        lastPublishedBy: user,
        lastPublishedOn: "2024-01-25T07:20:49.543Z",
        locale: "fr-FR",
        location: {
            folderId: "root"
        },
        locked: true,
        meta: {},
        modelId: "fbForm",
        modifiedBy: user,
        modifiedOn: "2024-01-25T07:20:49.543Z",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-25T07:20:32.550Z",
        revisionFirstPublishedBy: user,
        revisionFirstPublishedOn: "2024-01-25T07:20:49.543Z",
        revisionLastPublishedBy: user,
        revisionLastPublishedOn: "2024-01-25T07:20:49.543Z",
        revisionModifiedBy: user,
        revisionModifiedOn: "2024-01-25T07:20:49.543Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-25T07:20:49.543Z",
        savedBy: user,
        savedOn: "2024-01-25T07:20:49.543Z",
        status: "published",
        tenant: "otherTenant",
        TYPE: "cms.entry.l",
        values: {
            "json@triggers": null,
            "object@fields": [
                {
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@options": [],
                    "object@validation": [],
                    "text@fieldId": "demoField",
                    "text@helpText": null,
                    "text@label": "Demo Field",
                    "text@name": "text",
                    "text@placeholderText": null,
                    "text@type": "text",
                    "text@_id": "tk4jYhc8DI"
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
                    "json@layout": [["tk4jYhc8DI"]],
                    "text@title": "Step 1"
                }
            ],
            "text@formId": "65b20bc00321db00083d35c9",
            "text@name": "Demo Form 11",
            "text@slug": "demo-form-11-65b20bc00321db00083d35c9"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#otherTenant#L#fr-FR#CMS#CME#CME#65b20bc00321db00083d35c9",
        SK: "P",
        createdBy: user,
        createdOn: "2024-01-25T07:20:32.550Z",
        entryId: "65b20bc00321db00083d35c9",
        firstPublishedBy: user,
        firstPublishedOn: "2024-01-25T07:20:49.543Z",
        GSI1_PK: "T#otherTenant#L#fr-FR#CMS#CME#M#fbForm#P",
        GSI1_SK: "65b20bc00321db00083d35c9#0001",
        id: "65b20bc00321db00083d35c9#0001",
        lastPublishedBy: user,
        lastPublishedOn: "2024-01-25T07:20:49.543Z",
        locale: "fr-FR",
        location: {
            folderId: "root"
        },
        locked: true,
        meta: {},
        modelId: "fbForm",
        modifiedBy: user,
        modifiedOn: "2024-01-25T07:20:49.543Z",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-25T07:20:32.550Z",
        revisionFirstPublishedBy: user,
        revisionFirstPublishedOn: "2024-01-25T07:20:49.543Z",
        revisionLastPublishedBy: user,
        revisionLastPublishedOn: "2024-01-25T07:20:49.543Z",
        revisionModifiedBy: user,
        revisionModifiedOn: "2024-01-25T07:20:49.543Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-25T07:20:49.543Z",
        savedBy: user,
        savedOn: "2024-01-25T07:20:49.543Z",
        status: "published",
        tenant: "otherTenant",
        TYPE: "cms.entry.p",
        values: {
            "json@triggers": null,
            "object@fields": [
                {
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@options": [],
                    "object@validation": [],
                    "text@fieldId": "demoField",
                    "text@helpText": null,
                    "text@label": "Demo Field",
                    "text@name": "text",
                    "text@placeholderText": null,
                    "text@type": "text",
                    "text@_id": "tk4jYhc8DI"
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
                    "json@layout": [["tk4jYhc8DI"]],
                    "text@title": "Step 1"
                }
            ],
            "text@formId": "65b20bc00321db00083d35c9",
            "text@name": "Demo Form 11",
            "text@slug": "demo-form-11-65b20bc00321db00083d35c9"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#otherTenant#L#fr-FR#CMS#CME#CME#65b20bc00321db00083d35c9",
        SK: "REV#0001",
        createdBy: user,
        createdOn: "2024-01-25T07:20:32.550Z",
        entryId: "65b20bc00321db00083d35c9",
        firstPublishedBy: user,
        firstPublishedOn: "2024-01-25T07:20:49.543Z",
        GSI1_PK: "T#otherTenant#L#fr-FR#CMS#CME#M#fbForm#A",
        GSI1_SK: "65b20bc00321db00083d35c9#0001",
        id: "65b20bc00321db00083d35c9#0001",
        lastPublishedBy: user,
        lastPublishedOn: "2024-01-25T07:20:49.543Z",
        locale: "fr-FR",
        location: {
            folderId: "root"
        },
        locked: true,
        meta: {},
        modelId: "fbForm",
        modifiedBy: user,
        modifiedOn: "2024-01-25T07:20:49.543Z",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-25T07:20:32.550Z",
        revisionFirstPublishedBy: user,
        revisionFirstPublishedOn: "2024-01-25T07:20:49.543Z",
        revisionLastPublishedBy: user,
        revisionLastPublishedOn: "2024-01-25T07:20:49.543Z",
        revisionModifiedBy: user,
        revisionModifiedOn: "2024-01-25T07:20:49.543Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-25T07:20:49.543Z",
        savedBy: user,
        savedOn: "2024-01-25T07:20:49.543Z",
        status: "published",
        tenant: "otherTenant",
        TYPE: "cms.entry",
        values: {
            "json@triggers": null,
            "object@fields": [
                {
                    "json@settings": {
                        defaultValue: null
                    },
                    "object@options": [],
                    "object@validation": [],
                    "text@fieldId": "demoField",
                    "text@helpText": null,
                    "text@label": "Demo Field",
                    "text@name": "text",
                    "text@placeholderText": null,
                    "text@type": "text",
                    "text@_id": "tk4jYhc8DI"
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
                    "json@layout": [["tk4jYhc8DI"]],
                    "text@title": "Step 1"
                }
            ],
            "text@formId": "65b20bc00321db00083d35c9",
            "text@name": "Demo Form 11",
            "text@slug": "demo-form-11-65b20bc00321db00083d35c9"
        },
        version: 1,
        webinyVersion: "0.0.0"
    }
];

export const migratedFormStatsData = [
    // Form with 2 revisions: 1° published, 2° draft
    {
        PK: "T#root#L#en-US#CMS#CME#CME#65b12c8ecd6a580008f2fa31-0001-stats",
        SK: "L",
        createdBy: user,
        createdOn: "2024-01-24T15:28:14.710Z",
        entryId: "65b12c8ecd6a580008f2fa31-0001-stats",
        GSI1_PK: "T#root#L#en-US#CMS#CME#M#fbFormStat#L",
        GSI1_SK: "65b12c8ecd6a580008f2fa31-0001-stats#0001",
        id: "65b12c8ecd6a580008f2fa31-0001-stats#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fbFormStat",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T15:28:14.710Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T15:28:31.263Z",
        savedBy: user,
        savedOn: "2024-01-24T15:28:31.263Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry.l",
        values: {
            "number@formVersion": 1,
            "number@submissions": 10,
            "number@views": 100,
            "text@formId": "65b12c8ecd6a580008f2fa31"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#CME#65b12c8ecd6a580008f2fa31-0001-stats",
        SK: "REV#0001",
        createdBy: user,
        createdOn: "2024-01-24T15:28:14.710Z",
        entryId: "65b12c8ecd6a580008f2fa31-0001-stats",
        GSI1_PK: "T#root#L#en-US#CMS#CME#M#fbFormStat#A",
        GSI1_SK: "65b12c8ecd6a580008f2fa31-0001-stats#0001",
        id: "65b12c8ecd6a580008f2fa31-0001-stats#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fbFormStat",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T15:28:14.710Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T15:28:31.263Z",
        savedBy: user,
        savedOn: "2024-01-24T15:28:31.263Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry",
        values: {
            "number@formVersion": 1,
            "number@submissions": 10,
            "number@views": 100,
            "text@formId": "65b12c8ecd6a580008f2fa31"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#CME#65b12c8ecd6a580008f2fa31-0002-stats",
        SK: "L",
        createdBy: user,
        createdOn: "2024-01-24T15:28:37.723Z",
        entryId: "65b12c8ecd6a580008f2fa31-0002-stats",
        GSI1_PK: "T#root#L#en-US#CMS#CME#M#fbFormStat#L",
        GSI1_SK: "65b12c8ecd6a580008f2fa31-0002-stats#0001",
        id: "65b12c8ecd6a580008f2fa31-0002-stats#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fbFormStat",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T15:28:37.723Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T15:28:41.543Z",
        savedBy: user,
        savedOn: "2024-01-24T15:28:41.543Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry.l",
        values: {
            "number@formVersion": 2,
            "number@submissions": 0,
            "number@views": 0,
            "text@formId": "65b12c8ecd6a580008f2fa31"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#CME#65b12c8ecd6a580008f2fa31-0002-stats",
        SK: "REV#0001",
        createdBy: user,
        createdOn: "2024-01-24T15:28:37.723Z",
        entryId: "65b12c8ecd6a580008f2fa31-0002-stats",
        GSI1_PK: "T#root#L#en-US#CMS#CME#M#fbFormStat#A",
        GSI1_SK: "65b12c8ecd6a580008f2fa31-0002-stats#0001",
        id: "65b12c8ecd6a580008f2fa31-0002-stats#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fbFormStat",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T15:28:37.723Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T15:28:41.543Z",
        savedBy: user,
        savedOn: "2024-01-24T15:28:41.543Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry",
        values: {
            "number@formVersion": 2,
            "number@submissions": 0,
            "number@views": 0,
            "text@formId": "65b12c8ecd6a580008f2fa31"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },

    // Form with 1 draft revision
    {
        PK: "T#root#L#en-US#CMS#CME#CME#65b139b15cb71f0008718ac9-0001-stats",
        SK: "L",
        createdBy: user,
        createdOn: "2024-01-24T16:24:17.185Z",
        entryId: "65b139b15cb71f0008718ac9-0001-stats",
        GSI1_PK: "T#root#L#en-US#CMS#CME#M#fbFormStat#L",
        GSI1_SK: "65b139b15cb71f0008718ac9-0001-stats#0001",
        id: "65b139b15cb71f0008718ac9-0001-stats#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fbFormStat",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T16:24:17.185Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T16:24:34.090Z",
        savedBy: user,
        savedOn: "2024-01-24T16:24:34.090Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry.l",
        values: {
            "number@formVersion": 1,
            "number@submissions": 0,
            "number@views": 0,
            "text@formId": "65b139b15cb71f0008718ac9"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#CME#65b139b15cb71f0008718ac9-0001-stats",
        SK: "REV#0001",
        createdBy: user,
        createdOn: "2024-01-24T16:24:17.185Z",
        entryId: "65b139b15cb71f0008718ac9-0001-stats",
        GSI1_PK: "T#root#L#en-US#CMS#CME#M#fbFormStat#A",
        GSI1_SK: "65b139b15cb71f0008718ac9-0001-stats#0001",
        id: "65b139b15cb71f0008718ac9-0001-stats#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fbFormStat",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T16:24:17.185Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T16:24:34.090Z",
        savedBy: user,
        savedOn: "2024-01-24T16:24:34.090Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry",
        values: {
            "number@formVersion": 1,
            "number@submissions": 0,
            "number@views": 0,
            "text@formId": "65b139b15cb71f0008718ac9"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },

    // Form with 4 revisions: 1° published, 2° published, 3° unpublished, 4° draft
    {
        PK: "T#root#L#en-US#CMS#CME#CME#65b14a9982c87000081f93b3-0003-stats",
        SK: "L",
        createdBy: user,
        createdOn: "2024-01-24T17:38:28.497Z",
        entryId: "65b14a9982c87000081f93b3-0003-stats",
        GSI1_PK: "T#root#L#en-US#CMS#CME#M#fbFormStat#L",
        GSI1_SK: "65b14a9982c87000081f93b3-0003-stats#0001",
        id: "65b14a9982c87000081f93b3-0003-stats#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fbFormStat",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T17:38:28.497Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T17:39:26.457Z",
        savedBy: user,
        savedOn: "2024-01-24T17:39:26.457Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry.l",
        values: {
            "number@formVersion": 3,
            "number@submissions": 0,
            "number@views": 0,
            "text@formId": "65b14a9982c87000081f93b3"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#CME#65b14a9982c87000081f93b3-0003-stats",
        SK: "REV#0001",
        createdBy: user,
        createdOn: "2024-01-24T17:38:28.497Z",
        entryId: "65b14a9982c87000081f93b3-0003-stats",
        GSI1_PK: "T#root#L#en-US#CMS#CME#M#fbFormStat#A",
        GSI1_SK: "65b14a9982c87000081f93b3-0003-stats#0001",
        id: "65b14a9982c87000081f93b3-0003-stats#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fbFormStat",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T17:38:28.497Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T17:39:26.457Z",
        savedBy: user,
        savedOn: "2024-01-24T17:39:26.457Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry",
        values: {
            "number@formVersion": 3,
            "number@submissions": 0,
            "number@views": 0,
            "text@formId": "65b14a9982c87000081f93b3"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#CME#65b14a9982c87000081f93b3-0001-stats",
        SK: "L",
        createdBy: user,
        createdOn: "2024-01-24T17:36:25.519Z",
        entryId: "65b14a9982c87000081f93b3-0001-stats",
        GSI1_PK: "T#root#L#en-US#CMS#CME#M#fbFormStat#L",
        GSI1_SK: "65b14a9982c87000081f93b3-0001-stats#0001",
        id: "65b14a9982c87000081f93b3-0001-stats#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fbFormStat",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T17:36:25.519Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T17:36:45.577Z",
        savedBy: user,
        savedOn: "2024-01-24T17:36:45.577Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry.l",
        values: {
            "number@formVersion": 1,
            "number@submissions": 1,
            "number@views": 10,
            "text@formId": "65b14a9982c87000081f93b3"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#CME#65b14a9982c87000081f93b3-0001-stats",
        SK: "REV#0001",
        createdBy: user,
        createdOn: "2024-01-24T17:36:25.519Z",
        entryId: "65b14a9982c87000081f93b3-0001-stats",
        GSI1_PK: "T#root#L#en-US#CMS#CME#M#fbFormStat#A",
        GSI1_SK: "65b14a9982c87000081f93b3-0001-stats#0001",
        id: "65b14a9982c87000081f93b3-0001-stats#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fbFormStat",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T17:36:25.519Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T17:36:45.577Z",
        savedBy: user,
        savedOn: "2024-01-24T17:36:45.577Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry",
        values: {
            "number@formVersion": 1,
            "number@submissions": 1,
            "number@views": 10,
            "text@formId": "65b14a9982c87000081f93b3"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#CME#65b14a9982c87000081f93b3-0004-stats",
        SK: "L",
        createdBy: user,
        createdOn: "2024-01-24T17:39:11.428Z",
        entryId: "65b14a9982c87000081f93b3-0004-stats",
        GSI1_PK: "T#root#L#en-US#CMS#CME#M#fbFormStat#L",
        GSI1_SK: "65b14a9982c87000081f93b3-0004-stats#0001",
        id: "65b14a9982c87000081f93b3-0004-stats#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fbFormStat",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T17:39:11.428Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T17:39:11.428Z",
        savedBy: user,
        savedOn: "2024-01-24T17:39:11.428Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry.l",
        values: {
            "number@formVersion": 4,
            "number@submissions": 0,
            "number@views": 0,
            "text@formId": "65b14a9982c87000081f93b3"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#CME#65b14a9982c87000081f93b3-0004-stats",
        SK: "REV#0001",
        createdBy: user,
        createdOn: "2024-01-24T17:39:11.428Z",
        entryId: "65b14a9982c87000081f93b3-0004-stats",
        GSI1_PK: "T#root#L#en-US#CMS#CME#M#fbFormStat#A",
        GSI1_SK: "65b14a9982c87000081f93b3-0004-stats#0001",
        id: "65b14a9982c87000081f93b3-0004-stats#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fbFormStat",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T17:39:11.428Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T17:39:11.428Z",
        savedBy: user,
        savedOn: "2024-01-24T17:39:11.428Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry",
        values: {
            "number@formVersion": 4,
            "number@submissions": 0,
            "number@views": 0,
            "text@formId": "65b14a9982c87000081f93b3"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#CME#65b14a9982c87000081f93b3-0002-stats",
        SK: "L",
        createdBy: user,
        createdOn: "2024-01-24T17:37:08.943Z",
        entryId: "65b14a9982c87000081f93b3-0002-stats",
        GSI1_PK: "T#root#L#en-US#CMS#CME#M#fbFormStat#L",
        GSI1_SK: "65b14a9982c87000081f93b3-0002-stats#0001",
        id: "65b14a9982c87000081f93b3-0002-stats#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fbFormStat",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T17:37:08.943Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T17:37:13.678Z",
        savedBy: user,
        savedOn: "2024-01-24T17:37:13.678Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry.l",
        values: {
            "number@formVersion": 2,
            "number@submissions": 2,
            "number@views": 20,
            "text@formId": "65b14a9982c87000081f93b3"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#CME#65b14a9982c87000081f93b3-0002-stats",
        SK: "REV#0001",
        createdBy: user,
        createdOn: "2024-01-24T17:37:08.943Z",
        entryId: "65b14a9982c87000081f93b3-0002-stats",
        GSI1_PK: "T#root#L#en-US#CMS#CME#M#fbFormStat#A",
        GSI1_SK: "65b14a9982c87000081f93b3-0002-stats#0001",
        id: "65b14a9982c87000081f93b3-0002-stats#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fbFormStat",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T17:37:08.943Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T17:37:13.678Z",
        savedBy: user,
        savedOn: "2024-01-24T17:37:13.678Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry",
        values: {
            "number@formVersion": 2,
            "number@submissions": 2,
            "number@views": 20,
            "text@formId": "65b14a9982c87000081f93b3"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },

    // Form with contact fields, required, organised in 2 steps
    {
        PK: "T#root#L#en-US#CMS#CME#CME#65b16a8d7918760008c0ea56-0001-stats",
        SK: "L",
        createdBy: user,
        createdOn: "2024-01-24T19:52:45.637Z",
        entryId: "65b16a8d7918760008c0ea56-0001-stats",
        GSI1_PK: "T#root#L#en-US#CMS#CME#M#fbFormStat#L",
        GSI1_SK: "65b16a8d7918760008c0ea56-0001-stats#0001",
        id: "65b16a8d7918760008c0ea56-0001-stats#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fbFormStat",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T19:52:45.637Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T19:53:54.458Z",
        savedBy: user,
        savedOn: "2024-01-24T19:53:54.458Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry.l",
        values: {
            "number@formVersion": 1,
            "number@submissions": 0,
            "number@views": 0,
            "text@formId": "65b16a8d7918760008c0ea56"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#CME#65b16a8d7918760008c0ea56-0001-stats",
        SK: "REV#0001",
        createdBy: user,
        createdOn: "2024-01-24T19:52:45.637Z",
        entryId: "65b16a8d7918760008c0ea56-0001-stats",
        GSI1_PK: "T#root#L#en-US#CMS#CME#M#fbFormStat#A",
        GSI1_SK: "65b16a8d7918760008c0ea56-0001-stats#0001",
        id: "65b16a8d7918760008c0ea56-0001-stats#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fbFormStat",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T19:52:45.637Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T19:53:54.458Z",
        savedBy: user,
        savedOn: "2024-01-24T19:53:54.458Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry",
        values: {
            "number@formVersion": 1,
            "number@submissions": 0,
            "number@views": 0,
            "text@formId": "65b16a8d7918760008c0ea56"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },

    // Form with default fields
    {
        PK: "T#root#L#en-US#CMS#CME#CME#65b189f16f69800008e6161b-0001-stats",
        SK: "L",
        createdBy: user,
        createdOn: "2024-01-24T22:06:41.291Z",
        entryId: "65b189f16f69800008e6161b-0001-stats",
        GSI1_PK: "T#root#L#en-US#CMS#CME#M#fbFormStat#L",
        GSI1_SK: "65b189f16f69800008e6161b-0001-stats#0001",
        id: "65b189f16f69800008e6161b-0001-stats#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fbFormStat",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T22:06:41.291Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T22:13:12.913Z",
        savedBy: user,
        savedOn: "2024-01-24T22:13:12.913Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry.l",
        values: {
            "number@formVersion": 1,
            "number@submissions": 0,
            "number@views": 0,
            "text@formId": "65b189f16f69800008e6161b"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#CME#65b189f16f69800008e6161b-0001-stats",
        SK: "REV#0001",
        createdBy: user,
        createdOn: "2024-01-24T22:06:41.291Z",
        entryId: "65b189f16f69800008e6161b-0001-stats",
        GSI1_PK: "T#root#L#en-US#CMS#CME#M#fbFormStat#A",
        GSI1_SK: "65b189f16f69800008e6161b-0001-stats#0001",
        id: "65b189f16f69800008e6161b-0001-stats#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fbFormStat",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T22:06:41.291Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T22:13:12.913Z",
        savedBy: user,
        savedOn: "2024-01-24T22:13:12.913Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry",
        values: {
            "number@formVersion": 1,
            "number@submissions": 0,
            "number@views": 0,
            "text@formId": "65b189f16f69800008e6161b"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },

    // Form with custom settings
    {
        PK: "T#root#L#en-US#CMS#CME#CME#65b18df865a46200087864f9-0001-stats",
        SK: "L",
        createdBy: user,
        createdOn: "2024-01-24T22:23:52.364Z",
        entryId: "65b18df865a46200087864f9-0001-stats",
        GSI1_PK: "T#root#L#en-US#CMS#CME#M#fbFormStat#L",
        GSI1_SK: "65b18df865a46200087864f9-0001-stats#0001",
        id: "65b18df865a46200087864f9-0001-stats#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fbFormStat",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T22:23:52.364Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T22:26:03.138Z",
        savedBy: user,
        savedOn: "2024-01-24T22:26:03.138Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry.l",
        values: {
            "number@formVersion": 1,
            "number@submissions": 0,
            "number@views": 0,
            "text@formId": "65b18df865a46200087864f9"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#en-US#CMS#CME#CME#65b18df865a46200087864f9-0001-stats",
        SK: "REV#0001",
        createdBy: user,
        createdOn: "2024-01-24T22:23:52.364Z",
        entryId: "65b18df865a46200087864f9-0001-stats",
        GSI1_PK: "T#root#L#en-US#CMS#CME#M#fbFormStat#A",
        GSI1_SK: "65b18df865a46200087864f9-0001-stats#0001",
        id: "65b18df865a46200087864f9-0001-stats#0001",
        locale: "en-US",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fbFormStat",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T22:23:52.364Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T22:26:03.138Z",
        savedBy: user,
        savedOn: "2024-01-24T22:26:03.138Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry",
        values: {
            "number@formVersion": 1,
            "number@submissions": 0,
            "number@views": 0,
            "text@formId": "65b18df865a46200087864f9"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },

    // Form 1 from root tenant, locale de-DE
    {
        PK: "T#root#L#de-DE#CMS#CME#CME#65b190cad481d800089f2479-0001-stats",
        SK: "L",
        createdBy: user,
        createdOn: "2024-01-24T22:35:54.384Z",
        entryId: "65b190cad481d800089f2479-0001-stats",
        GSI1_PK: "T#root#L#de-DE#CMS#CME#M#fbFormStat#L",
        GSI1_SK: "65b190cad481d800089f2479-0001-stats#0001",
        id: "65b190cad481d800089f2479-0001-stats#0001",
        locale: "de-DE",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fbFormStat",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T22:35:54.384Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T22:36:12.348Z",
        savedBy: user,
        savedOn: "2024-01-24T22:36:12.348Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry.l",
        values: {
            "number@formVersion": 1,
            "number@submissions": 100,
            "number@views": 1000,
            "text@formId": "65b190cad481d800089f2479"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#de-DE#CMS#CME#CME#65b190cad481d800089f2479-0001-stats",
        SK: "REV#0001",
        createdBy: user,
        createdOn: "2024-01-24T22:35:54.384Z",
        entryId: "65b190cad481d800089f2479-0001-stats",
        GSI1_PK: "T#root#L#de-DE#CMS#CME#M#fbFormStat#A",
        GSI1_SK: "65b190cad481d800089f2479-0001-stats#0001",
        id: "65b190cad481d800089f2479-0001-stats#0001",
        locale: "de-DE",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fbFormStat",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T22:35:54.384Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T22:36:12.348Z",
        savedBy: user,
        savedOn: "2024-01-24T22:36:12.348Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry",
        values: {
            "number@formVersion": 1,
            "number@submissions": 100,
            "number@views": 1000,
            "text@formId": "65b190cad481d800089f2479"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },

    // Form 2 from root tenant, locale de-DE
    {
        PK: "T#root#L#de-DE#CMS#CME#CME#65b2050e264766000809d7aa-0001-stats",
        SK: "L",
        createdBy: user,
        createdOn: "2024-01-25T06:51:58.036Z",
        entryId: "65b2050e264766000809d7aa-0001-stats",
        GSI1_PK: "T#root#L#de-DE#CMS#CME#M#fbFormStat#L",
        GSI1_SK: "65b2050e264766000809d7aa-0001-stats#0001",
        id: "65b2050e264766000809d7aa-0001-stats#0001",
        locale: "de-DE",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fbFormStat",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-25T06:51:58.036Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-25T06:52:51.920Z",
        savedBy: user,
        savedOn: "2024-01-25T06:52:51.920Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry.l",
        values: {
            "number@formVersion": 1,
            "number@submissions": 10,
            "number@views": 100,
            "text@formId": "65b2050e264766000809d7aa"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#de-DE#CMS#CME#CME#65b2050e264766000809d7aa-0001-stats",
        SK: "REV#0001",
        createdBy: user,
        createdOn: "2024-01-25T06:51:58.036Z",
        entryId: "65b2050e264766000809d7aa-0001-stats",
        GSI1_PK: "T#root#L#de-DE#CMS#CME#M#fbFormStat#A",
        GSI1_SK: "65b2050e264766000809d7aa-0001-stats#0001",
        id: "65b2050e264766000809d7aa-0001-stats#0001",
        locale: "de-DE",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fbFormStat",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-25T06:51:58.036Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-25T06:52:51.920Z",
        savedBy: user,
        savedOn: "2024-01-25T06:52:51.920Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry",
        values: {
            "number@formVersion": 1,
            "number@submissions": 10,
            "number@views": 100,
            "text@formId": "65b2050e264766000809d7aa"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#de-DE#CMS#CME#CME#65b2050e264766000809d7aa-0002-stats",
        SK: "L",
        createdBy: user,
        createdOn: "2024-01-25T06:52:56.840Z",
        entryId: "65b2050e264766000809d7aa-0002-stats",
        GSI1_PK: "T#root#L#de-DE#CMS#CME#M#fbFormStat#L",
        GSI1_SK: "65b2050e264766000809d7aa-0002-stats#0001",
        id: "65b2050e264766000809d7aa-0002-stats#0001",
        locale: "de-DE",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fbFormStat",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-25T06:52:56.840Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-25T06:53:03.955Z",
        savedBy: user,
        savedOn: "2024-01-25T06:53:03.955Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry.l",
        values: {
            "number@formVersion": 2,
            "number@submissions": 0,
            "number@views": 0,
            "text@formId": "65b2050e264766000809d7aa"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#de-DE#CMS#CME#CME#65b2050e264766000809d7aa-0002-stats",
        SK: "REV#0001",
        createdBy: user,
        createdOn: "2024-01-25T06:52:56.840Z",
        entryId: "65b2050e264766000809d7aa-0002-stats",
        GSI1_PK: "T#root#L#de-DE#CMS#CME#M#fbFormStat#A",
        GSI1_SK: "65b2050e264766000809d7aa-0002-stats#0001",
        id: "65b2050e264766000809d7aa-0002-stats#0001",
        locale: "de-DE",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fbFormStat",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-25T06:52:56.840Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-25T06:53:03.955Z",
        savedBy: user,
        savedOn: "2024-01-25T06:53:03.955Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry",
        values: {
            "number@formVersion": 2,
            "number@submissions": 0,
            "number@views": 0,
            "text@formId": "65b2050e264766000809d7aa"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },

    // Form 1 from root tenant, locale fr-FR
    {
        PK: "T#root#L#fr-FR#CMS#CME#CME#65b19428b583b90008e7a3bc-0001-stats",
        SK: "L",
        createdBy: user,
        createdOn: "2024-01-24T22:50:16.158Z",
        entryId: "65b19428b583b90008e7a3bc-0001-stats",
        GSI1_PK: "T#root#L#fr-FR#CMS#CME#M#fbFormStat#L",
        GSI1_SK: "65b19428b583b90008e7a3bc-0001-stats#0001",
        id: "65b19428b583b90008e7a3bc-0001-stats#0001",
        locale: "fr-FR",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fbFormStat",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T22:50:16.158Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T22:50:26.517Z",
        savedBy: user,
        savedOn: "2024-01-24T22:50:26.517Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry.l",
        values: {
            "number@formVersion": 1,
            "number@submissions": 0,
            "number@views": 0,
            "text@formId": "65b19428b583b90008e7a3bc"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#root#L#fr-FR#CMS#CME#CME#65b19428b583b90008e7a3bc-0001-stats",
        SK: "REV#0001",
        createdBy: user,
        createdOn: "2024-01-24T22:50:16.158Z",
        entryId: "65b19428b583b90008e7a3bc-0001-stats",
        GSI1_PK: "T#root#L#fr-FR#CMS#CME#M#fbFormStat#A",
        GSI1_SK: "65b19428b583b90008e7a3bc-0001-stats#0001",
        id: "65b19428b583b90008e7a3bc-0001-stats#0001",
        locale: "fr-FR",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fbFormStat",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-24T22:50:16.158Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-24T22:50:26.517Z",
        savedBy: user,
        savedOn: "2024-01-24T22:50:26.517Z",
        status: "draft",
        tenant: "root",
        TYPE: "cms.entry",
        values: {
            "number@formVersion": 1,
            "number@submissions": 0,
            "number@views": 0,
            "text@formId": "65b19428b583b90008e7a3bc"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },

    // Form 1 from otherTenant, locale fr-FR
    {
        PK: "T#otherTenant#L#fr-FR#CMS#CME#CME#65b20b8f0321db00083d35c1-0001-stats",
        SK: "L",
        createdBy: user,
        createdOn: "2024-01-25T07:19:43.219Z",
        entryId: "65b20b8f0321db00083d35c1-0001-stats",
        GSI1_PK: "T#otherTenant#L#fr-FR#CMS#CME#M#fbFormStat#L",
        GSI1_SK: "65b20b8f0321db00083d35c1-0001-stats#0001",
        id: "65b20b8f0321db00083d35c1-0001-stats#0001",
        locale: "fr-FR",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fbFormStat",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-25T07:19:43.219Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-25T07:19:51.052Z",
        savedBy: user,
        savedOn: "2024-01-25T07:19:51.052Z",
        status: "draft",
        tenant: "otherTenant",
        TYPE: "cms.entry.l",
        values: {
            "number@formVersion": 1,
            "number@submissions": 0,
            "number@views": 0,
            "text@formId": "65b20b8f0321db00083d35c1"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#otherTenant#L#fr-FR#CMS#CME#CME#65b20b8f0321db00083d35c1-0001-stats",
        SK: "REV#0001",
        createdBy: user,
        createdOn: "2024-01-25T07:19:43.219Z",
        entryId: "65b20b8f0321db00083d35c1-0001-stats",
        GSI1_PK: "T#otherTenant#L#fr-FR#CMS#CME#M#fbFormStat#A",
        GSI1_SK: "65b20b8f0321db00083d35c1-0001-stats#0001",
        id: "65b20b8f0321db00083d35c1-0001-stats#0001",
        locale: "fr-FR",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fbFormStat",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-25T07:19:43.219Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-25T07:19:51.052Z",
        savedBy: user,
        savedOn: "2024-01-25T07:19:51.052Z",
        status: "draft",
        tenant: "otherTenant",
        TYPE: "cms.entry",
        values: {
            "number@formVersion": 1,
            "number@submissions": 0,
            "number@views": 0,
            "text@formId": "65b20b8f0321db00083d35c1"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },

    // Form 2 from otherTenant, locale fr-FR
    {
        PK: "T#otherTenant#L#fr-FR#CMS#CME#CME#65b20bc00321db00083d35c9-0001-stats",
        SK: "L",
        createdBy: user,
        createdOn: "2024-01-25T07:20:32.550Z",
        entryId: "65b20bc00321db00083d35c9-0001-stats",
        GSI1_PK: "T#otherTenant#L#fr-FR#CMS#CME#M#fbFormStat#L",
        GSI1_SK: "65b20bc00321db00083d35c9-0001-stats#0001",
        id: "65b20bc00321db00083d35c9-0001-stats#0001",
        locale: "fr-FR",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fbFormStat",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-25T07:20:32.550Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-25T07:20:49.543Z",
        savedBy: user,
        savedOn: "2024-01-25T07:20:49.543Z",
        status: "draft",
        tenant: "otherTenant",
        TYPE: "cms.entry.l",
        values: {
            "number@formVersion": 1,
            "number@submissions": 0,
            "number@views": 1000,
            "text@formId": "65b20bc00321db00083d35c9"
        },
        version: 1,
        webinyVersion: "0.0.0"
    },
    {
        PK: "T#otherTenant#L#fr-FR#CMS#CME#CME#65b20bc00321db00083d35c9-0001-stats",
        SK: "REV#0001",
        createdBy: user,
        createdOn: "2024-01-25T07:20:32.550Z",
        entryId: "65b20bc00321db00083d35c9-0001-stats",
        GSI1_PK: "T#otherTenant#L#fr-FR#CMS#CME#M#fbFormStat#A",
        GSI1_SK: "65b20bc00321db00083d35c9-0001-stats#0001",
        id: "65b20bc00321db00083d35c9-0001-stats#0001",
        locale: "fr-FR",
        location: {
            folderId: "root"
        },
        locked: false,
        modelId: "fbFormStat",
        revisionCreatedBy: user,
        revisionCreatedOn: "2024-01-25T07:20:32.550Z",
        revisionSavedBy: user,
        revisionSavedOn: "2024-01-25T07:20:49.543Z",
        savedBy: user,
        savedOn: "2024-01-25T07:20:49.543Z",
        status: "draft",
        tenant: "otherTenant",
        TYPE: "cms.entry",
        values: {
            "number@formVersion": 1,
            "number@submissions": 0,
            "number@views": 1000,
            "text@formId": "65b20bc00321db00083d35c9"
        },
        version: 1,
        webinyVersion: "0.0.0"
    }
];
