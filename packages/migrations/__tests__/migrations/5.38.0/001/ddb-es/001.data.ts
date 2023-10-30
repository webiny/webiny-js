export const createdBy = {
    id: "admin",
    type: "admin",
    displayName: "Admin"
};

export const createFormsData = () => {
    return [
        {
            PK: "T#root#L#en-US#FB#F#653a578347a0da00088b9f2f",
            SK: "L",
            createdBy,
            createdOn: "2023-10-26T12:12:53.100Z",
            fields: [
                {
                    fieldId: "firstName",
                    helpText: null,
                    label: "First name",
                    name: "firstName",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [],
                    _id: "FtbDUq-AF"
                },
                {
                    fieldId: "lastName",
                    helpText: null,
                    label: "Last name",
                    name: "lastName",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [],
                    _id: "p3FAh-AjE"
                }
            ],
            formId: "653a578347a0da00088b9f2f",
            id: "653a578347a0da00088b9f2f#0003",
            layout: [["FtbDUq-AF"], ["p3FAh-AjE"]],
            locale: "en-US",
            locked: false,
            name: "Form 1 v3",
            ownedBy: createdBy,
            published: false,
            savedOn: "2023-10-26T12:12:57.221Z",
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
            slug: "form-1-653a578347a0da00088b9f2f",
            stats: {
                submissions: 0,
                views: 0
            },
            status: "draft",
            tenant: "root",
            TYPE: "fb.form.latest",
            version: 3,
            webinyVersion: "5.38.7",
            _ct: "2023-10-26T12:12:57.227Z",
            _et: "FormBuilderForm",
            _md: "2023-10-26T12:12:57.227Z"
        },
        {
            PK: "T#root#L#en-US#FB#F#653a578347a0da00088b9f2f",
            SK: "LP",
            createdBy,
            createdOn: "2023-10-26T12:12:34.218Z",
            fields: [
                {
                    fieldId: "firstName",
                    helpText: null,
                    label: "First name",
                    name: "firstName",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [],
                    _id: "FtbDUq-AF"
                },
                {
                    fieldId: "lastName",
                    helpText: null,
                    label: "Last name",
                    name: "lastName",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [],
                    _id: "p3FAh-AjE"
                }
            ],
            formId: "653a578347a0da00088b9f2f",
            id: "653a578347a0da00088b9f2f#0002",
            layout: [["FtbDUq-AF"], ["p3FAh-AjE"]],
            locale: "en-US",
            locked: true,
            name: "Form 1 v2",
            ownedBy: createdBy,
            published: true,
            publishedOn: "2023-10-26T12:12:44.998Z",
            savedOn: "2023-10-26T12:12:44.998Z",
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
            slug: "form-1-653a578347a0da00088b9f2f",
            stats: {
                submissions: 0,
                views: 0
            },
            status: "published",
            tenant: "root",
            TYPE: "fb.form.latestPublished",
            version: 2,
            webinyVersion: "5.38.7",
            _ct: "2023-10-26T12:12:45.001Z",
            _et: "FormBuilderForm",
            _md: "2023-10-26T12:12:45.001Z"
        },
        {
            PK: "T#root#L#en-US#FB#F#653a578347a0da00088b9f2f",
            SK: "REV#0001",
            createdBy,
            createdOn: "2023-10-26T12:11:47.668Z",
            fields: [
                {
                    fieldId: "firstName",
                    helpText: null,
                    label: "First name",
                    name: "firstName",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [],
                    _id: "FtbDUq-AF"
                },
                {
                    fieldId: "lastName",
                    helpText: null,
                    label: "Last name",
                    name: "lastName",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [],
                    _id: "p3FAh-AjE"
                },
                {
                    fieldId: "email",
                    helpText: null,
                    label: "Email",
                    name: "email",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [
                        {
                            message: "Please enter a valid e-mail.",
                            name: "pattern",
                            settings: {
                                flags: null,
                                preset: "email",
                                regex: null
                            }
                        }
                    ],
                    _id: "xksWeGPE2"
                }
            ],
            formId: "653a578347a0da00088b9f2f",
            id: "653a578347a0da00088b9f2f#0001",
            layout: [["FtbDUq-AF"], ["p3FAh-AjE"], ["xksWeGPE2"]],
            locale: "en-US",
            locked: true,
            name: "Form 1",
            ownedBy: createdBy,
            published: true,
            publishedOn: "2023-10-26T12:12:29.208Z",
            savedOn: "2023-10-26T12:12:29.208Z",
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
            slug: "form-1-653a578347a0da00088b9f2f",
            stats: {
                submissions: 0,
                views: 0
            },
            status: "published",
            tenant: "root",
            TYPE: "fb.form",
            version: 1,
            webinyVersion: "5.38.7",
            _ct: "2023-10-26T12:12:29.222Z",
            _et: "FormBuilderForm",
            _md: "2023-10-26T12:12:29.222Z"
        },
        {
            PK: "T#root#L#en-US#FB#F#653a578347a0da00088b9f2f",
            SK: "REV#0002",
            createdBy,
            createdOn: "2023-10-26T12:12:34.218Z",
            fields: [
                {
                    fieldId: "firstName",
                    helpText: null,
                    label: "First name",
                    name: "firstName",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [],
                    _id: "FtbDUq-AF"
                },
                {
                    fieldId: "lastName",
                    helpText: null,
                    label: "Last name",
                    name: "lastName",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [],
                    _id: "p3FAh-AjE"
                }
            ],
            formId: "653a578347a0da00088b9f2f",
            id: "653a578347a0da00088b9f2f#0002",
            layout: [["FtbDUq-AF"], ["p3FAh-AjE"]],
            locale: "en-US",
            locked: true,
            name: "Form 1 v2",
            ownedBy: createdBy,
            published: true,
            publishedOn: "2023-10-26T12:12:44.998Z",
            savedOn: "2023-10-26T12:12:44.998Z",
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
            slug: "form-1-653a578347a0da00088b9f2f",
            stats: {
                submissions: 0,
                views: 0
            },
            status: "published",
            tenant: "root",
            TYPE: "fb.form",
            version: 2,
            webinyVersion: "5.38.7",
            _ct: "2023-10-26T12:12:45.004Z",
            _et: "FormBuilderForm",
            _md: "2023-10-26T12:12:45.004Z"
        },
        {
            PK: "T#root#L#en-US#FB#F#653a578347a0da00088b9f2f",
            SK: "REV#0003",
            createdBy,
            createdOn: "2023-10-26T12:12:53.100Z",
            fields: [
                {
                    fieldId: "firstName",
                    helpText: null,
                    label: "First name",
                    name: "firstName",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [],
                    _id: "FtbDUq-AF"
                },
                {
                    fieldId: "lastName",
                    helpText: null,
                    label: "Last name",
                    name: "lastName",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [],
                    _id: "p3FAh-AjE"
                }
            ],
            formId: "653a578347a0da00088b9f2f",
            id: "653a578347a0da00088b9f2f#0003",
            layout: [["FtbDUq-AF"], ["p3FAh-AjE"]],
            locale: "en-US",
            locked: false,
            name: "Form 1 v3",
            ownedBy: createdBy,
            published: false,
            savedOn: "2023-10-26T12:12:57.221Z",
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
            slug: "form-1-653a578347a0da00088b9f2f",
            stats: {
                submissions: 0,
                views: 0
            },
            status: "draft",
            tenant: "root",
            TYPE: "fb.form",
            version: 3,
            webinyVersion: "5.38.7",
            _ct: "2023-10-26T12:12:57.227Z",
            _et: "FormBuilderForm",
            _md: "2023-10-26T12:12:57.227Z"
        }
    ];
};

export const createEsFormsData = () => {
    return [
        {
            formId: "653a578347a0da00088b9f2f",
            savedOn: "2023-10-26T12:12:57.221Z",
            published: false,
            locale: "en-US",
            createdOn: "2023-10-26T12:12:53.100Z",
            version: 3,
            createdBy: {
                displayName: "ad min",
                id: "653a57005faa2500080227f4",
                type: "admin"
            },
            webinyVersion: "5.37.7",
            __type: "fb.form",
            name: "Form 1 v3",
            id: "653a578347a0da00088b9f2f#0003",
            locked: false,
            ownedBy: {
                displayName: "ad min",
                id: "653a57005faa2500080227f4",
                type: "admin"
            },
            slug: "form-1-653a578347a0da00088b9f2f",
            tenant: "root",
            status: "draft"
        },
        {
            data: {
                firstName: "one",
                lastName: "two",
                jobTitle: "four",
                email: "three@three.com"
            },
            form: {
                layout: [["Dxye-uTxZ"], ["F7OHlHobd"], ["CTa88hKhF"], ["EZzUH0RuE"]],
                parent: "653f80144866de00082fb764",
                name: "Form1",
                id: "653f80144866de00082fb764#0002",
                fields: [
                    {
                        settings: {
                            defaultValue: null
                        },
                        helpText: null,
                        name: "firstName",
                        options: [],
                        placeholderText: null,
                        _id: "Dxye-uTxZ",
                        label: "First name",
                        type: "text",
                        validation: [],
                        fieldId: "firstName"
                    },
                    {
                        settings: {
                            defaultValue: null
                        },
                        helpText: null,
                        name: "lastName",
                        options: [],
                        placeholderText: null,
                        _id: "F7OHlHobd",
                        label: "Last name",
                        type: "text",
                        validation: [],
                        fieldId: "lastName"
                    },
                    {
                        settings: {
                            defaultValue: null
                        },
                        helpText: null,
                        name: "email",
                        options: [],
                        placeholderText: null,
                        _id: "CTa88hKhF",
                        label: "Email",
                        type: "text",
                        validation: [
                            {
                                settings: {
                                    regex: null,
                                    flags: null,
                                    preset: "email"
                                },
                                name: "pattern",
                                message: "Please enter a valid e-mail."
                            }
                        ],
                        fieldId: "email"
                    },
                    {
                        settings: {
                            defaultValue: null
                        },
                        helpText: null,
                        name: "jobTitle",
                        options: [],
                        placeholderText: null,
                        _id: "EZzUH0RuE",
                        label: "Job title",
                        type: "text",
                        validation: [],
                        fieldId: "jobTitle"
                    }
                ],
                version: 2
            },
            webinyVersion: "5.37.8",
            meta: {
                ip: "0.0.0.0",
                submittedOn: "2023-10-30T10:08:03.069Z",
                url: {
                    query: {
                        preview: "653f804a639a930008cde314#0001",
                        __tenant: "root",
                        __locale: "en-US"
                    },
                    location:
                        "https://diorb6363f1go.cloudfront.net/untitled-locqk5st?preview=653f804a639a930008cde314%230001&__locale=en-US&__tenant=root"
                }
            },
            savedOn: "2023-10-30T10:08:03.403Z",
            __type: "fb.submission",
            id: "653f8083639a930008cde316",
            locale: "en-US",
            createdOn: "2023-10-30T10:08:03.403Z",
            ownedBy: {
                displayName: "ad min",
                id: "653f7fc9639a930008cde2f9",
                type: "admin"
            },
            logs: [],
            tenant: "root"
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
                createdBy
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
                createdBy
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
            createdBy,
            tenant: "root",
            webinyVersion: "0.0.0"
        },
        {
            PK: `T#root#I18N#L`,
            SK: "de-DE",
            code: "de-DE",
            default: false,
            createdOn: "2023-01-25T09:37:58.220Z",
            createdBy,
            tenant: "root",
            webinyVersion: "0.0.0"
        },
        {
            PK: `T#root#I18N#L`,
            SK: "fr-FR",
            code: "fr-FR",
            default: false,
            createdOn: "2023-01-25T09:37:58.220Z",
            createdBy,
            tenant: "root",
            webinyVersion: "0.0.0"
        },
        {
            PK: `T#otherTenant#I18N#L`,
            SK: "fr-FR",
            code: "fr-FR",
            default: false,
            createdOn: "2023-01-25T09:37:58.220Z",
            createdBy,
            tenant: "otherTenant",
            webinyVersion: "0.0.0"
        },
        {
            PK: `T#otherTenant#I18N#L`,
            SK: "de-DE",
            code: "de-DE",
            default: true,
            createdOn: "2023-01-25T09:37:58.220Z",
            createdBy,
            tenant: "otherTenant",
            webinyVersion: "0.0.0"
        }
    ];
};
