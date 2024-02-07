export const user = {
    id: "admin",
    type: "admin",
    displayName: "Admin"
};

export const createFormsData = () => {
    return [
        {
            PK: "T#root#L#en-US#FB#F#65c0a07038a36e00082095ea",
            SK: "L",
            createdBy: user,
            createdOn: "2024-02-05T08:46:40.354Z",
            fields: [
                {
                    fieldId: "demoField",
                    helpText: null,
                    label: "Demo field",
                    name: "text",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [],
                    _id: "fi0rrnUHdl"
                }
            ],
            formId: "65c0a07038a36e00082095ea",
            id: "65c0a07038a36e00082095ea#0001",
            locale: "en-US",
            locked: true,
            name: "Demo form 1",
            ownedBy: user,
            published: true,
            publishedOn: "2024-02-05T08:47:01.134Z",
            savedOn: "2024-02-05T08:47:01.134Z",
            settings: {
                fullWidthSubmitButton: null,
                layout: {
                    renderer: "default"
                },
                reCaptcha: {
                    enabled: null,
                    errorMessage: "Please verify that you are not a robot."
                },
                submitButtonLabel: null,
                successMessage: null,
                termsOfServiceMessage: null
            },
            slug: "demo-form-1-65c0a07038a36e00082095ea",
            stats: {
                submissions: 5000,
                views: 10000
            },
            status: "published",
            steps: [
                {
                    layout: [["fi0rrnUHdl"]],
                    title: "Step 1"
                }
            ],
            tenant: "root",
            TYPE: "fb.form.latest",
            version: 1,
            webinyVersion: "0.0.0",
            _ct: "2024-02-05T08:47:01.152Z",
            _et: "FormBuilderForm",
            _md: "2024-02-05T08:47:01.152Z"
        },
        {
            PK: "T#root#L#en-US#FB#F#65c0a07038a36e00082095ea",
            SK: "LP",
            createdBy: user,
            createdOn: "2024-02-05T08:46:40.354Z",
            fields: [
                {
                    fieldId: "demoField",
                    helpText: null,
                    label: "Demo field",
                    name: "text",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [],
                    _id: "fi0rrnUHdl"
                }
            ],
            formId: "65c0a07038a36e00082095ea",
            id: "65c0a07038a36e00082095ea#0001",
            locale: "en-US",
            locked: true,
            name: "Demo form 1",
            ownedBy: user,
            published: true,
            publishedOn: "2024-02-05T08:47:01.134Z",
            savedOn: "2024-02-05T08:47:01.134Z",
            settings: {
                fullWidthSubmitButton: null,
                layout: {
                    renderer: "default"
                },
                reCaptcha: {
                    enabled: null,
                    errorMessage: "Please verify that you are not a robot."
                },
                submitButtonLabel: null,
                successMessage: null,
                termsOfServiceMessage: null
            },
            slug: "demo-form-1-65c0a07038a36e00082095ea",
            stats: {
                submissions: 5000,
                views: 10000
            },
            status: "published",
            steps: [
                {
                    layout: [["fi0rrnUHdl"]],
                    title: "Step 1"
                }
            ],
            tenant: "root",
            TYPE: "fb.form.latestPublished",
            version: 1,
            webinyVersion: "0.0.0",
            _ct: "2024-02-05T08:47:01.152Z",
            _et: "FormBuilderForm",
            _md: "2024-02-05T08:47:01.152Z"
        },
        {
            PK: "T#root#L#en-US#FB#F#65c0a07038a36e00082095ea",
            SK: "REV#0001",
            createdBy: user,
            createdOn: "2024-02-05T08:46:40.354Z",
            fields: [
                {
                    fieldId: "demoField",
                    helpText: null,
                    label: "Demo field",
                    name: "text",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [],
                    _id: "fi0rrnUHdl"
                }
            ],
            formId: "65c0a07038a36e00082095ea",
            id: "65c0a07038a36e00082095ea#0001",
            locale: "en-US",
            locked: true,
            name: "Demo form 1",
            ownedBy: user,
            published: true,
            publishedOn: "2024-02-05T08:47:01.134Z",
            savedOn: "2024-02-05T08:47:01.134Z",
            settings: {
                fullWidthSubmitButton: null,
                layout: {
                    renderer: "default"
                },
                reCaptcha: {
                    enabled: null,
                    errorMessage: "Please verify that you are not a robot."
                },
                submitButtonLabel: null,
                successMessage: null,
                termsOfServiceMessage: null
            },
            slug: "demo-form-1-65c0a07038a36e00082095ea",
            stats: {
                submissions: 5000,
                views: 10000
            },
            status: "published",
            steps: [
                {
                    layout: [["fi0rrnUHdl"]],
                    title: "Step 1"
                }
            ],
            tenant: "root",
            TYPE: "fb.form",
            version: 1,
            webinyVersion: "0.0.0",
            _ct: "2024-02-05T08:47:01.152Z",
            _et: "FormBuilderForm",
            _md: "2024-02-05T08:47:01.152Z"
        }
    ];
};

export const createTenantsData = () => {
    return [
        {
            PK: "T#root",
            SK: "A",
            createdOn: "2023-01-25T09:37:58.183Z",
            description: "The top-level Webiny tenant.",
            GSI1_PK: "TENANTS",
            GSI1_SK: "T#null#2023-01-25T09:37:58.183Z",
            data: {
                id: "root",
                name: "Root",
                savedOn: "2023-01-25T09:37:58.183Z",
                settings: {
                    domains: []
                },
                status: "active",
                TYPE: "tenancy.tenant",
                webinyVersion: "0.0.0",
                createdBy: user
            }
        },
        {
            PK: "T#otherTenant",
            SK: "A",
            createdOn: "2023-03-11T09:59:17.327Z",
            description: "Tenant #1",
            GSI1_PK: "TENANTS",
            GSI1_SK: "T#root#2023-03-11T09:59:17.327Z",
            data: {
                id: "otherTenant",
                name: "Other Tenant",
                parent: "root",
                savedOn: "2023-03-11T09:59:17.327Z",
                settings: {
                    domains: []
                },
                status: "active",
                TYPE: "tenancy.tenant",
                webinyVersion: "0.0.0",
                createdBy: user
            }
        }
    ];
};

export const createLocalesData = () => {
    return [
        {
            PK: `T#root#I18N#L`,
            SK: "en-US",
            code: "en-US",
            default: true,
            createdOn: "2023-01-25T09:37:58.220Z",
            createdBy: user,
            tenant: "root",
            webinyVersion: "0.0.0"
        },
        {
            PK: `T#root#I18N#L`,
            SK: "de-DE",
            code: "de-DE",
            default: false,
            createdOn: "2023-01-25T09:37:58.220Z",
            createdBy: user,
            tenant: "root",
            webinyVersion: "0.0.0"
        },
        {
            PK: `T#root#I18N#L`,
            SK: "fr-FR",
            code: "fr-FR",
            default: false,
            createdOn: "2023-01-25T09:37:58.220Z",
            createdBy: user,
            tenant: "root",
            webinyVersion: "0.0.0"
        },
        {
            PK: `T#otherTenant#I18N#L`,
            SK: "fr-FR",
            code: "fr-FR",
            default: false,
            createdOn: "2023-01-25T09:37:58.220Z",
            createdBy: user,
            tenant: "otherTenant",
            webinyVersion: "0.0.0"
        },
        {
            PK: `T#otherTenant#I18N#L`,
            SK: "de-DE",
            code: "de-DE",
            default: true,
            createdOn: "2023-01-25T09:37:58.220Z",
            createdBy: user,
            tenant: "otherTenant",
            webinyVersion: "0.0.0"
        }
    ];
};
