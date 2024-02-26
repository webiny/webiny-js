export const createdBy = {
    id: "admin",
    type: "admin",
    displayName: "Admin"
};

export const createFormsData = () => {
    return [
        {
            PK: "T#root#L#en-US#FB#F#L",
            SK: "653a4ff9daeb1e00081ae00f",
            createdBy,
            createdOn: "2023-10-26T11:40:06.567Z",
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
                    _id: "Y9OCPiqvc"
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
                    _id: "x-JujxcvA"
                }
            ],
            formId: "653a4ff9daeb1e00081ae00f",
            id: "653a4ff9daeb1e00081ae00f#0003",
            layout: [["Y9OCPiqvc"], ["x-JujxcvA"]],
            locale: "en-US",
            locked: false,
            name: "Form 1 v3",
            ownedBy: createdBy,
            published: false,
            savedOn: "2023-10-26T11:40:09.749Z",
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
            slug: "form-1-653a4ff9daeb1e00081ae00f",
            stats: {
                submissions: 0,
                views: 0
            },
            status: "draft",
            tenant: "root",
            TYPE: "fb.form.latest",
            version: 3,
            webinyVersion: "5.38.7",
            _ct: "2023-10-26T11:40:09.807Z",
            _et: "FormBuilderForm",
            _md: "2023-10-26T11:40:09.807Z"
        },
        {
            PK: "T#root#L#en-US#FB#F#LP",
            SK: "653a4ff9daeb1e00081ae00f",
            createdBy,
            createdOn: "2023-10-26T11:39:50.612Z",
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
                    _id: "Y9OCPiqvc"
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
                    _id: "x-JujxcvA"
                }
            ],
            formId: "653a4ff9daeb1e00081ae00f",
            id: "653a4ff9daeb1e00081ae00f#0002",
            layout: [["Y9OCPiqvc"], ["x-JujxcvA"]],
            locale: "en-US",
            locked: true,
            name: "Form 1 v2",
            ownedBy: createdBy,
            published: true,
            publishedOn: "2023-10-26T11:40:03.926Z",
            savedOn: "2023-10-26T11:40:03.926Z",
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
            slug: "form-1-653a4ff9daeb1e00081ae00f",
            stats: {
                submissions: 0,
                views: 0
            },
            status: "published",
            tenant: "root",
            TYPE: "fb.form.latestPublished",
            version: 2,
            webinyVersion: "5.38.7",
            _ct: "2023-10-26T11:40:03.932Z",
            _et: "FormBuilderForm",
            _md: "2023-10-26T11:40:03.932Z"
        },
        {
            PK: "T#root#L#en-US#FB#F",
            SK: "653a4ff9daeb1e00081ae00f#0001",
            createdBy,
            createdOn: "2023-10-26T11:39:38.238Z",
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
                    _id: "Y9OCPiqvc"
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
                    _id: "x-JujxcvA"
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
                    _id: "KsMO9GY23"
                }
            ],
            formId: "653a4ff9daeb1e00081ae00f",
            GSI1_PK: "T#root#L#en-US#FB#F#653a4ff9daeb1e00081ae00f",
            GSI1_SK: "1",
            id: "653a4ff9daeb1e00081ae00f#0001",
            layout: [["Y9OCPiqvc"], ["x-JujxcvA"], ["KsMO9GY23"]],
            locale: "en-US",
            locked: true,
            name: "Form 1",
            ownedBy: createdBy,
            published: true,
            publishedOn: "2023-10-26T11:39:48.651Z",
            savedOn: "2023-10-26T11:39:48.651Z",
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
            slug: "form-1-653a4ff9daeb1e00081ae00f",
            stats: {
                submissions: 0,
                views: 0
            },
            status: "published",
            tenant: "root",
            TYPE: "fb.form",
            version: 1,
            webinyVersion: "5.38.7",
            _ct: "2023-10-26T11:39:48.657Z",
            _et: "FormBuilderForm",
            _md: "2023-10-26T11:39:48.657Z"
        },
        {
            PK: "T#root#L#en-US#FB#F",
            SK: "653a4ff9daeb1e00081ae00f#0002",
            createdBy,
            createdOn: "2023-10-26T11:39:50.612Z",
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
                    _id: "Y9OCPiqvc"
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
                    _id: "x-JujxcvA"
                }
            ],
            formId: "653a4ff9daeb1e00081ae00f",
            GSI1_PK: "T#root#L#en-US#FB#F#653a4ff9daeb1e00081ae00f",
            GSI1_SK: "2",
            id: "653a4ff9daeb1e00081ae00f#0002",
            layout: [["Y9OCPiqvc"], ["x-JujxcvA"]],
            locale: "en-US",
            locked: true,
            name: "Form 1 v2",
            ownedBy: createdBy,
            published: true,
            publishedOn: "2023-10-26T11:40:03.926Z",
            savedOn: "2023-10-26T11:40:03.926Z",
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
            slug: "form-1-653a4ff9daeb1e00081ae00f",
            stats: {
                submissions: 0,
                views: 0
            },
            status: "published",
            tenant: "root",
            TYPE: "fb.form",
            version: 2,
            webinyVersion: "5.38.7",
            _ct: "2023-10-26T11:40:03.932Z",
            _et: "FormBuilderForm",
            _md: "2023-10-26T11:40:03.932Z"
        },
        {
            PK: "T#root#L#en-US#FB#F",
            SK: "653a4ff9daeb1e00081ae00f#0003",
            createdBy,
            createdOn: "2023-10-26T11:40:06.567Z",
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
                    _id: "Y9OCPiqvc"
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
                    _id: "x-JujxcvA"
                }
            ],
            formId: "653a4ff9daeb1e00081ae00f",
            GSI1_PK: "T#root#L#en-US#FB#F#653a4ff9daeb1e00081ae00f",
            GSI1_SK: "3",
            id: "653a4ff9daeb1e00081ae00f#0003",
            layout: [["Y9OCPiqvc"], ["x-JujxcvA"]],
            locale: "en-US",
            locked: false,
            name: "Form 1 v3",
            ownedBy: createdBy,
            published: false,
            savedOn: "2023-10-26T11:40:09.749Z",
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
            slug: "form-1-653a4ff9daeb1e00081ae00f",
            stats: {
                submissions: 0,
                views: 0
            },
            status: "draft",
            tenant: "root",
            TYPE: "fb.form",
            version: 3,
            webinyVersion: "5.38.7",
            _ct: "2023-10-26T11:40:09.807Z",
            _et: "FormBuilderForm",
            _md: "2023-10-26T11:40:09.807Z"
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
