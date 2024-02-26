export const migratedData = [
    {
        PK: "T#root#L#en-US#FB#F#653a578347a0da00088b9f2f",
        SK: "L",
        TYPE: "fb.form.latest",
        created: "2023-10-26T12:12:57.227Z",
        createdBy: {
            displayName: "Admin",
            id: "admin",
            type: "admin"
        },
        createdOn: "2023-10-26T12:12:53.100Z",
        entity: "FormBuilderForm",
        fields: [
            {
                _id: "FtbDUq-AF",
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
                validation: []
            },
            {
                _id: "p3FAh-AjE",
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
                validation: []
            }
        ],
        formId: "653a578347a0da00088b9f2f",
        id: "653a578347a0da00088b9f2f#0003",
        locale: "en-US",
        locked: false,
        modified: "2023-10-26T12:12:57.227Z",
        name: "Form 1 v3",
        ownedBy: {
            displayName: "Admin",
            id: "admin",
            type: "admin"
        },
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
        steps: [
            {
                layout: [["FtbDUq-AF"], ["p3FAh-AjE"]],
                title: "Step 1"
            }
        ],
        tenant: "root",
        version: 3,
        webinyVersion: "5.38.7"
    },
    {
        PK: "T#root#L#en-US#FB#F#653a578347a0da00088b9f2f",
        SK: "LP",
        TYPE: "fb.form.latestPublished",
        created: "2023-10-26T12:12:45.001Z",
        createdBy: {
            displayName: "Admin",
            id: "admin",
            type: "admin"
        },
        createdOn: "2023-10-26T12:12:34.218Z",
        entity: "FormBuilderForm",
        fields: [
            {
                _id: "FtbDUq-AF",
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
                validation: []
            },
            {
                _id: "p3FAh-AjE",
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
                validation: []
            }
        ],
        formId: "653a578347a0da00088b9f2f",
        id: "653a578347a0da00088b9f2f#0002",
        locale: "en-US",
        locked: true,
        modified: "2023-10-26T12:12:45.001Z",
        name: "Form 1 v2",
        ownedBy: {
            displayName: "Admin",
            id: "admin",
            type: "admin"
        },
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
        steps: [
            {
                layout: [["FtbDUq-AF"], ["p3FAh-AjE"]],
                title: "Step 1"
            }
        ],
        tenant: "root",
        version: 2,
        webinyVersion: "5.38.7"
    },
    {
        PK: "T#root#L#en-US#FB#F#653a578347a0da00088b9f2f",
        SK: "REV#0001",
        TYPE: "fb.form",
        created: "2023-10-26T12:12:29.222Z",
        createdBy: {
            displayName: "Admin",
            id: "admin",
            type: "admin"
        },
        createdOn: "2023-10-26T12:11:47.668Z",
        entity: "FormBuilderForm",
        fields: [
            {
                _id: "FtbDUq-AF",
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
                validation: []
            },
            {
                _id: "p3FAh-AjE",
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
                validation: []
            },
            {
                _id: "xksWeGPE2",
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
                ]
            }
        ],
        formId: "653a578347a0da00088b9f2f",
        id: "653a578347a0da00088b9f2f#0001",
        locale: "en-US",
        locked: true,
        modified: "2023-10-26T12:12:29.222Z",
        name: "Form 1",
        ownedBy: {
            displayName: "Admin",
            id: "admin",
            type: "admin"
        },
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
        steps: [
            {
                layout: [["FtbDUq-AF"], ["p3FAh-AjE"], ["xksWeGPE2"]],
                title: "Step 1"
            }
        ],
        tenant: "root",
        version: 1,
        webinyVersion: "5.38.7"
    },
    {
        PK: "T#root#L#en-US#FB#F#653a578347a0da00088b9f2f",
        SK: "REV#0002",
        TYPE: "fb.form",
        created: "2023-10-26T12:12:45.004Z",
        createdBy: {
            displayName: "Admin",
            id: "admin",
            type: "admin"
        },
        createdOn: "2023-10-26T12:12:34.218Z",
        entity: "FormBuilderForm",
        fields: [
            {
                _id: "FtbDUq-AF",
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
                validation: []
            },
            {
                _id: "p3FAh-AjE",
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
                validation: []
            }
        ],
        formId: "653a578347a0da00088b9f2f",
        id: "653a578347a0da00088b9f2f#0002",
        locale: "en-US",
        locked: true,
        modified: "2023-10-26T12:12:45.004Z",
        name: "Form 1 v2",
        ownedBy: {
            displayName: "Admin",
            id: "admin",
            type: "admin"
        },
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
        steps: [
            {
                layout: [["FtbDUq-AF"], ["p3FAh-AjE"]],
                title: "Step 1"
            }
        ],
        tenant: "root",
        version: 2,
        webinyVersion: "5.38.7"
    },
    {
        PK: "T#root#L#en-US#FB#F#653a578347a0da00088b9f2f",
        SK: "REV#0003",
        TYPE: "fb.form",
        created: "2023-10-26T12:12:57.227Z",
        createdBy: {
            displayName: "Admin",
            id: "admin",
            type: "admin"
        },
        createdOn: "2023-10-26T12:12:53.100Z",
        entity: "FormBuilderForm",
        fields: [
            {
                _id: "FtbDUq-AF",
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
                validation: []
            },
            {
                _id: "p3FAh-AjE",
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
                validation: []
            }
        ],
        formId: "653a578347a0da00088b9f2f",
        id: "653a578347a0da00088b9f2f#0003",
        locale: "en-US",
        locked: false,
        modified: "2023-10-26T12:12:57.227Z",
        name: "Form 1 v3",
        ownedBy: {
            displayName: "Admin",
            id: "admin",
            type: "admin"
        },
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
        steps: [
            {
                layout: [["FtbDUq-AF"], ["p3FAh-AjE"]],
                title: "Step 1"
            }
        ],
        tenant: "root",
        version: 3,
        webinyVersion: "5.38.7"
    }
];
