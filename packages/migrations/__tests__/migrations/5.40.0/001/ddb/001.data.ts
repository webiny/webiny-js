export const user = {
    id: "admin",
    type: "admin",
    displayName: "Admin"
};

export const createFormsData = () => {
    return [
        // Form with 2 revisions: 1° published, 2° draft
        {
            PK: "T#root#L#en-US#FB#F",
            SK: "65b12c8ecd6a580008f2fa31#0001",
            createdBy: user,
            createdOn: "2024-01-24T15:28:14.710Z",
            fields: [
                {
                    fieldId: "demoField",
                    helpText: null,
                    label: "Demo Field",
                    name: "text",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [],
                    _id: "Pr3Pj3w2zO"
                }
            ],
            formId: "65b12c8ecd6a580008f2fa31",
            GSI1_PK: "T#root#L#en-US#FB#F#65b12c8ecd6a580008f2fa31",
            GSI1_SK: "1",
            id: "65b12c8ecd6a580008f2fa31#0001",
            locale: "en-US",
            locked: true,
            name: "Demo Form 1",
            ownedBy: user,
            published: true,
            publishedOn: "2024-01-24T15:28:31.263Z",
            savedOn: "2024-01-24T15:28:31.263Z",
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
            slug: "demo-form-1-65b12c8ecd6a580008f2fa31",
            stats: {
                submissions: 100,
                views: 1000
            },
            status: "published",
            steps: [
                {
                    layout: [["Pr3Pj3w2zO"]],
                    title: "Step 1"
                }
            ],
            tenant: "root",
            TYPE: "fb.form",
            version: 1,
            webinyVersion: "0.0.0",
            _ct: "2024-01-24T15:28:31.283Z",
            _et: "FormBuilderForm",
            _md: "2024-01-24T15:28:31.283Z"
        },
        {
            PK: "T#root#L#en-US#FB#F",
            SK: "65b12c8ecd6a580008f2fa31#0002",
            createdBy: user,
            createdOn: "2024-01-24T15:28:37.723Z",
            fields: [
                {
                    fieldId: "demoField",
                    helpText: null,
                    label: "Demo Field",
                    name: "text",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [
                        {
                            message: "Value is required.",
                            name: "required",
                            settings: {}
                        }
                    ],
                    _id: "Pr3Pj3w2zO"
                }
            ],
            formId: "65b12c8ecd6a580008f2fa31",
            GSI1_PK: "T#root#L#en-US#FB#F#65b12c8ecd6a580008f2fa31",
            GSI1_SK: "2",
            id: "65b12c8ecd6a580008f2fa31#0002",
            locale: "en-US",
            locked: false,
            name: "Demo Form 1",
            ownedBy: user,
            published: false,
            savedOn: "2024-01-24T15:28:41.543Z",
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
            slug: "demo-form-1-65b12c8ecd6a580008f2fa31",
            stats: {
                submissions: 0,
                views: 0
            },
            status: "draft",
            steps: [
                {
                    layout: [["Pr3Pj3w2zO"]],
                    title: "Step 1"
                }
            ],
            tenant: "root",
            TYPE: "fb.form",
            version: 2,
            webinyVersion: "0.0.0",
            _ct: "2024-01-24T15:28:41.548Z",
            _et: "FormBuilderForm",
            _md: "2024-01-24T15:28:41.548Z"
        },
        {
            PK: "T#root#L#en-US#FB#F#L",
            SK: "65b12c8ecd6a580008f2fa31",
            createdBy: user,
            createdOn: "2024-01-24T15:28:37.723Z",
            fields: [
                {
                    fieldId: "demoField",
                    helpText: null,
                    label: "Demo Field",
                    name: "text",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [
                        {
                            message: "Value is required.",
                            name: "required",
                            settings: {}
                        }
                    ],
                    _id: "Pr3Pj3w2zO"
                }
            ],
            formId: "65b12c8ecd6a580008f2fa31",
            id: "65b12c8ecd6a580008f2fa31#0002",
            locale: "en-US",
            locked: false,
            name: "Demo Form 1",
            ownedBy: user,
            published: false,
            savedOn: "2024-01-24T15:28:41.543Z",
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
            slug: "demo-form-1-65b12c8ecd6a580008f2fa31",
            stats: {
                submissions: 0,
                views: 0
            },
            status: "draft",
            steps: [
                {
                    layout: [["Pr3Pj3w2zO"]],
                    title: "Step 1"
                }
            ],
            tenant: "root",
            TYPE: "fb.form.latest",
            version: 2,
            webinyVersion: "0.0.0",
            _ct: "2024-01-24T15:28:41.549Z",
            _et: "FormBuilderForm",
            _md: "2024-01-24T15:28:41.549Z"
        },
        {
            PK: "T#root#L#en-US#FB#F#LP",
            SK: "65b12c8ecd6a580008f2fa31",
            createdBy: user,
            createdOn: "2024-01-24T15:28:14.710Z",
            fields: [
                {
                    fieldId: "demoField",
                    helpText: null,
                    label: "Demo Field",
                    name: "text",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [],
                    _id: "Pr3Pj3w2zO"
                }
            ],
            formId: "65b12c8ecd6a580008f2fa31",
            id: "65b12c8ecd6a580008f2fa31#0001",
            locale: "en-US",
            locked: true,
            name: "Demo Form 1",
            ownedBy: user,
            published: true,
            publishedOn: "2024-01-24T15:28:31.263Z",
            savedOn: "2024-01-24T15:28:31.263Z",
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
            slug: "demo-form-1-65b12c8ecd6a580008f2fa31",
            stats: {
                submissions: 10,
                views: 100
            },
            status: "published",
            steps: [
                {
                    layout: [["Pr3Pj3w2zO"]],
                    title: "Step 1"
                }
            ],
            tenant: "root",
            TYPE: "fb.form.latestPublished",
            version: 1,
            webinyVersion: "0.0.0",
            _ct: "2024-01-24T15:28:31.283Z",
            _et: "FormBuilderForm",
            _md: "2024-01-24T15:28:31.283Z"
        },

        // Form with 1 draft revision
        {
            PK: "T#root#L#en-US#FB#F",
            SK: "65b139b15cb71f0008718ac9#0001",
            createdBy: user,
            createdOn: "2024-01-24T16:24:17.185Z",
            fields: [
                {
                    fieldId: "demoField",
                    helpText: null,
                    label: "Demo Field",
                    name: "text",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [],
                    _id: "kpBvlR4SjU"
                }
            ],
            formId: "65b139b15cb71f0008718ac9",
            GSI1_PK: "T#root#L#en-US#FB#F#65b139b15cb71f0008718ac9",
            GSI1_SK: "1",
            id: "65b139b15cb71f0008718ac9#0001",
            locale: "en-US",
            locked: false,
            name: "Demo form 2",
            ownedBy: user,
            published: false,
            savedOn: "2024-01-24T16:24:34.090Z",
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
            slug: "demo-form-2-65b139b15cb71f0008718ac9",
            stats: {
                submissions: 0,
                views: 0
            },
            status: "draft",
            steps: [
                {
                    layout: [["kpBvlR4SjU"]],
                    title: "Step 1"
                }
            ],
            tenant: "root",
            TYPE: "fb.form",
            version: 1,
            webinyVersion: "0.0.0",
            _ct: "2024-01-24T16:24:34.109Z",
            _et: "FormBuilderForm",
            _md: "2024-01-24T16:24:34.109Z"
        },
        {
            PK: "T#root#L#en-US#FB#F#L",
            SK: "65b139b15cb71f0008718ac9",
            createdBy: user,
            createdOn: "2024-01-24T16:24:17.185Z",
            fields: [
                {
                    fieldId: "demoField",
                    helpText: null,
                    label: "Demo Field",
                    name: "text",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [],
                    _id: "kpBvlR4SjU"
                }
            ],
            formId: "65b139b15cb71f0008718ac9",
            id: "65b139b15cb71f0008718ac9#0001",
            locale: "en-US",
            locked: false,
            name: "Demo form 2",
            ownedBy: user,
            published: false,
            savedOn: "2024-01-24T16:24:34.090Z",
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
            slug: "demo-form-2-65b139b15cb71f0008718ac9",
            stats: {
                submissions: 0,
                views: 0
            },
            status: "draft",
            steps: [
                {
                    layout: [["kpBvlR4SjU"]],
                    title: "Step 1"
                }
            ],
            tenant: "root",
            TYPE: "fb.form.latest",
            version: 1,
            webinyVersion: "0.0.0",
            _ct: "2024-01-24T16:24:34.110Z",
            _et: "FormBuilderForm",
            _md: "2024-01-24T16:24:34.110Z"
        },

        // Form with 4 revisions: 1° published, 2° published, 3° unpublished, 4° draft
        {
            PK: "T#root#L#en-US#FB#F",
            SK: "65b14a9982c87000081f93b3#0001",
            createdBy: user,
            createdOn: "2024-01-24T17:36:25.519Z",
            fields: [
                {
                    fieldId: "demoField",
                    helpText: null,
                    label: "Demo Field",
                    name: "text",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [],
                    _id: "VLGQV3Wx-o"
                }
            ],
            formId: "65b14a9982c87000081f93b3",
            GSI1_PK: "T#root#L#en-US#FB#F#65b14a9982c87000081f93b3",
            GSI1_SK: "1",
            id: "65b14a9982c87000081f93b3#0001",
            locale: "en-US",
            locked: true,
            name: "Demo Form 3",
            ownedBy: user,
            published: true,
            publishedOn: "2024-01-24T17:36:45.577Z",
            savedOn: "2024-01-24T17:36:45.577Z",
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
            slug: "demo-form-3-65b14a9982c87000081f93b3",
            stats: {
                submissions: 10,
                views: 100
            },
            status: "published",
            steps: [
                {
                    layout: [["VLGQV3Wx-o"]],
                    title: "Step 1"
                }
            ],
            tenant: "root",
            TYPE: "fb.form",
            version: 1,
            webinyVersion: "0.0.0",
            _ct: "2024-01-24T17:36:45.583Z",
            _et: "FormBuilderForm",
            _md: "2024-01-24T17:36:45.583Z"
        },
        {
            PK: "T#root#L#en-US#FB#F",
            SK: "65b14a9982c87000081f93b3#0002",
            createdBy: user,
            createdOn: "2024-01-24T17:37:08.943Z",
            fields: [
                {
                    fieldId: "demoField",
                    helpText: null,
                    label: "Demo Field",
                    name: "text",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [],
                    _id: "VLGQV3Wx-o"
                }
            ],
            formId: "65b14a9982c87000081f93b3",
            GSI1_PK: "T#root#L#en-US#FB#F#65b14a9982c87000081f93b3",
            GSI1_SK: "2",
            id: "65b14a9982c87000081f93b3#0002",
            locale: "en-US",
            locked: true,
            name: "Demo Form 3",
            ownedBy: user,
            published: true,
            publishedOn: "2024-01-24T17:37:13.678Z",
            savedOn: "2024-01-24T17:37:13.678Z",
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
            slug: "demo-form-3-65b14a9982c87000081f93b3",
            stats: {
                submissions: 20,
                views: 200
            },
            status: "published",
            steps: [
                {
                    layout: [["VLGQV3Wx-o"]],
                    title: "Step 1"
                }
            ],
            tenant: "root",
            TYPE: "fb.form",
            version: 2,
            webinyVersion: "0.0.0",
            _ct: "2024-01-24T17:37:13.682Z",
            _et: "FormBuilderForm",
            _md: "2024-01-24T17:37:13.682Z"
        },
        {
            PK: "T#root#L#en-US#FB#F",
            SK: "65b14a9982c87000081f93b3#0003",
            createdBy: user,
            createdOn: "2024-01-24T17:38:28.497Z",
            fields: [
                {
                    fieldId: "demoField",
                    helpText: null,
                    label: "Demo Field",
                    name: "text",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [],
                    _id: "VLGQV3Wx-o"
                }
            ],
            formId: "65b14a9982c87000081f93b3",
            GSI1_PK: "T#root#L#en-US#FB#F#65b14a9982c87000081f93b3",
            GSI1_SK: "3",
            id: "65b14a9982c87000081f93b3#0003",
            locale: "en-US",
            locked: true,
            name: "Demo Form 3",
            ownedBy: user,
            published: false,
            publishedOn: "2024-01-24T17:38:49.877Z",
            savedOn: "2024-01-24T17:39:26.457Z",
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
            slug: "demo-form-3-65b14a9982c87000081f93b3",
            stats: {
                submissions: 0,
                views: 0
            },
            status: "locked",
            steps: [
                {
                    layout: [["VLGQV3Wx-o"]],
                    title: "Step 1"
                }
            ],
            tenant: "root",
            TYPE: "fb.form",
            version: 3,
            webinyVersion: "0.0.0",
            _ct: "2024-01-24T17:39:26.498Z",
            _et: "FormBuilderForm",
            _md: "2024-01-24T17:39:26.498Z"
        },
        {
            PK: "T#root#L#en-US#FB#F",
            SK: "65b14a9982c87000081f93b3#0004",
            createdBy: user,
            createdOn: "2024-01-24T17:39:11.428Z",
            fields: [
                {
                    fieldId: "demoField",
                    helpText: null,
                    label: "Demo Field",
                    name: "text",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [],
                    _id: "VLGQV3Wx-o"
                }
            ],
            formId: "65b14a9982c87000081f93b3",
            GSI1_PK: "T#root#L#en-US#FB#F#65b14a9982c87000081f93b3",
            GSI1_SK: "4",
            id: "65b14a9982c87000081f93b3#0004",
            locale: "en-US",
            locked: false,
            name: "Demo Form 3",
            ownedBy: user,
            published: false,
            savedOn: "2024-01-24T17:39:11.428Z",
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
            slug: "demo-form-3-65b14a9982c87000081f93b3",
            stats: {
                submissions: 0,
                views: 0
            },
            status: "draft",
            steps: [
                {
                    layout: [["VLGQV3Wx-o"]],
                    title: "Step 1"
                }
            ],
            tenant: "root",
            TYPE: "fb.form",
            version: 4,
            webinyVersion: "0.0.0",
            _ct: "2024-01-24T17:39:11.429Z",
            _et: "FormBuilderForm",
            _md: "2024-01-24T17:39:11.429Z"
        },
        {
            PK: "T#root#L#en-US#FB#F#L",
            SK: "65b14a9982c87000081f93b3",
            createdBy: user,
            createdOn: "2024-01-24T17:39:11.428Z",
            fields: [
                {
                    fieldId: "demoField",
                    helpText: null,
                    label: "Demo Field",
                    name: "text",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [],
                    _id: "VLGQV3Wx-o"
                }
            ],
            formId: "65b14a9982c87000081f93b3",
            id: "65b14a9982c87000081f93b3#0004",
            locale: "en-US",
            locked: false,
            name: "Demo Form 3",
            ownedBy: user,
            published: false,
            savedOn: "2024-01-24T17:39:11.428Z",
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
            slug: "demo-form-3-65b14a9982c87000081f93b3",
            stats: {
                submissions: 0,
                views: 0
            },
            status: "draft",
            steps: [
                {
                    layout: [["VLGQV3Wx-o"]],
                    title: "Step 1"
                }
            ],
            tenant: "root",
            TYPE: "fb.form.latest",
            version: 4,
            webinyVersion: "0.0.0",
            _ct: "2024-01-24T17:39:11.429Z",
            _et: "FormBuilderForm",
            _md: "2024-01-24T17:39:11.429Z"
        },
        {
            PK: "T#root#L#en-US#FB#F#LP",
            SK: "65b14a9982c87000081f93b3",
            createdBy: user,
            createdOn: "2024-01-24T17:37:08.943Z",
            fields: [
                {
                    fieldId: "demoField",
                    helpText: null,
                    label: "Demo Field",
                    name: "text",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [],
                    _id: "VLGQV3Wx-o"
                }
            ],
            formId: "65b14a9982c87000081f93b3",
            GSI1_PK: "T#root#L#en-US#FB#F#65b14a9982c87000081f93b3",
            GSI1_SK: "2",
            id: "65b14a9982c87000081f93b3#0002",
            locale: "en-US",
            locked: true,
            name: "Demo Form 3",
            ownedBy: user,
            published: true,
            publishedOn: "2024-01-24T17:37:13.678Z",
            savedOn: "2024-01-24T17:37:13.678Z",
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
            slug: "demo-form-3-65b14a9982c87000081f93b3",
            stats: {
                submissions: 20,
                views: 200
            },
            status: "published",
            steps: [
                {
                    layout: [["VLGQV3Wx-o"]],
                    title: "Step 1"
                }
            ],
            tenant: "root",
            TYPE: "fb.form.latestPublished",
            version: 2,
            webinyVersion: "0.0.0",
            _ct: "2024-01-24T17:37:13.682Z",
            _et: "FormBuilderForm",
            _md: "2024-01-24T17:37:13.682Z"
        },

        // Form with contact fields, required, organised in 2 steps
        {
            PK: "T#root#L#en-US#FB#F#L",
            SK: "65b16a8d7918760008c0ea56",
            createdBy: user,
            createdOn: "2024-01-24T19:52:45.637Z",
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
                    validation: [
                        {
                            message: "Value is required.",
                            name: "required",
                            settings: {}
                        }
                    ],
                    _id: "wKBpJ6lq0"
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
                    validation: [
                        {
                            message: "Value is required.",
                            name: "required",
                            settings: {}
                        }
                    ],
                    _id: "ylPaYyVaM"
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
                        },
                        {
                            message: "Value is required.",
                            name: "required",
                            settings: {}
                        }
                    ],
                    _id: "u1miDVk2r"
                },
                {
                    fieldId: "phoneNumber",
                    helpText: null,
                    label: "Phone number",
                    name: "phoneNumber",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [
                        {
                            message: "Value is required.",
                            name: "required",
                            settings: {}
                        }
                    ],
                    _id: "54ED5X_p6"
                }
            ],
            formId: "65b16a8d7918760008c0ea56",
            id: "65b16a8d7918760008c0ea56#0001",
            locale: "en-US",
            locked: false,
            name: "Demo Form 4",
            ownedBy: user,
            published: false,
            savedOn: "2024-01-24T19:53:54.458Z",
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
            slug: "demo-form-4-65b16a8d7918760008c0ea56",
            stats: {
                submissions: 0,
                views: 0
            },
            status: "draft",
            steps: [
                {
                    layout: [["wKBpJ6lq0"], ["ylPaYyVaM"]],
                    title: "Step 1"
                },
                {
                    layout: [["u1miDVk2r"], ["54ED5X_p6"]],
                    title: "New Step"
                }
            ],
            tenant: "root",
            TYPE: "fb.form.latest",
            version: 1,
            webinyVersion: "0.0.0",
            _ct: "2024-01-24T19:53:54.477Z",
            _et: "FormBuilderForm",
            _md: "2024-01-24T19:53:54.477Z"
        },
        {
            PK: "T#root#L#en-US#FB#F",
            SK: "65b16a8d7918760008c0ea56#0001",
            createdBy: user,
            createdOn: "2024-01-24T19:52:45.637Z",
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
                    validation: [
                        {
                            message: "Value is required.",
                            name: "required",
                            settings: {}
                        }
                    ],
                    _id: "wKBpJ6lq0"
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
                    validation: [
                        {
                            message: "Value is required.",
                            name: "required",
                            settings: {}
                        }
                    ],
                    _id: "ylPaYyVaM"
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
                        },
                        {
                            message: "Value is required.",
                            name: "required",
                            settings: {}
                        }
                    ],
                    _id: "u1miDVk2r"
                },
                {
                    fieldId: "phoneNumber",
                    helpText: null,
                    label: "Phone number",
                    name: "phoneNumber",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [
                        {
                            message: "Value is required.",
                            name: "required",
                            settings: {}
                        }
                    ],
                    _id: "54ED5X_p6"
                }
            ],
            formId: "65b16a8d7918760008c0ea56",
            GSI1_PK: "T#root#L#en-US#FB#F#65b16a8d7918760008c0ea56",
            GSI1_SK: "1",
            id: "65b16a8d7918760008c0ea56#0001",
            locale: "en-US",
            locked: false,
            name: "Demo Form 4",
            ownedBy: user,
            published: false,
            savedOn: "2024-01-24T19:53:54.458Z",
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
            slug: "demo-form-4-65b16a8d7918760008c0ea56",
            stats: {
                submissions: 0,
                views: 0
            },
            status: "draft",
            steps: [
                {
                    layout: [["wKBpJ6lq0"], ["ylPaYyVaM"]],
                    title: "Step 1"
                },
                {
                    layout: [["u1miDVk2r"], ["54ED5X_p6"]],
                    title: "New Step"
                }
            ],
            tenant: "root",
            TYPE: "fb.form",
            version: 1,
            webinyVersion: "0.0.0",
            _ct: "2024-01-24T19:53:54.477Z",
            _et: "FormBuilderForm",
            _md: "2024-01-24T19:53:54.477Z"
        },

        // Form with default fields
        {
            PK: "T#root#L#en-US#FB#F",
            SK: "65b189f16f69800008e6161b#0001",
            createdBy: user,
            createdOn: "2024-01-24T22:06:41.291Z",
            fields: [
                {
                    fieldId: "hiddenField",
                    helpText: "Hidden Field - Help Text",
                    label: "Hidden Field",
                    name: "hidden",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: "Hidden Field - Default Value"
                    },
                    type: "hidden",
                    validation: [],
                    _id: "NZWPSHZRIN"
                },
                {
                    fieldId: "selectField",
                    helpText: "Select Field - Help Text",
                    label: "Select Field",
                    name: "select",
                    options: [
                        {
                            label: "Option 1",
                            value: "option1"
                        },
                        {
                            label: "Option 2",
                            value: "option2"
                        },
                        {
                            label: "Option 3",
                            value: "option3"
                        }
                    ],
                    placeholderText: "Select Field - Help Text",
                    settings: {
                        defaultValue: "option2"
                    },
                    type: "select",
                    validation: [],
                    _id: "vxI0OE-flE"
                },
                {
                    fieldId: "shortText",
                    helpText: "Short Text - Help Text",
                    label: "Short Text",
                    name: "text",
                    options: [],
                    placeholderText: "Short Text - Placeholder Text",
                    settings: {
                        defaultValue: "Short Text - Default Value"
                    },
                    type: "text",
                    validation: [
                        {
                            message: "Value is too short.",
                            name: "minLength",
                            settings: {
                                value: "1"
                            }
                        },
                        {
                            message: "Value is too long.",
                            name: "maxLength",
                            settings: {
                                value: "6"
                            }
                        }
                    ],
                    _id: "1om83kly5s"
                },
                {
                    fieldId: "longText",
                    helpText: "Long Text - Help Text",
                    label: "Long Text",
                    name: "textarea",
                    options: [],
                    placeholderText: "Long Text - Placeholder Text",
                    settings: {
                        defaultValue: "Long Text - Default Text",
                        rows: "10"
                    },
                    type: "textarea",
                    validation: [],
                    _id: "9L3Wgow6-b"
                },
                {
                    fieldId: "numberField",
                    helpText: "Number Field - Help Text",
                    label: "Number Field",
                    name: "number",
                    options: [],
                    placeholderText: "Number Field - Placeholder Text",
                    settings: {
                        defaultValue: null
                    },
                    type: "number",
                    validation: [],
                    _id: "2gUedk4Aa1"
                },
                {
                    fieldId: "radioField",
                    helpText: "Radio Field - Help Text",
                    label: "Radio Field",
                    name: "radio",
                    options: [
                        {
                            label: "Option 1",
                            value: "option1"
                        },
                        {
                            label: "Option 2",
                            value: "option2"
                        },
                        {
                            label: "Option 3",
                            value: "option3"
                        }
                    ],
                    placeholderText: null,
                    settings: {
                        defaultValue: "option2",
                        otherOption: true
                    },
                    type: "radio",
                    validation: [],
                    _id: "tiR3t0uctA"
                },
                {
                    fieldId: "checkboxField",
                    helpText: "Checkbox Field - Help Text",
                    label: "Checkbox Field",
                    name: "checkbox",
                    options: [
                        {
                            label: "Option 1",
                            value: "option1"
                        },
                        {
                            label: "Option 2",
                            value: "option2"
                        },
                        {
                            label: "Option 3",
                            value: "option3"
                        }
                    ],
                    placeholderText: null,
                    settings: {
                        defaultValue: ["option3"],
                        otherOption: true
                    },
                    type: "checkbox",
                    validation: [],
                    _id: "W99qOcY4ie"
                },
                {
                    fieldId: "dateTimeField",
                    helpText: "DateTime Field - Help Text",
                    label: "DateTime Field",
                    name: "date",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null,
                        format: "dateTimeWithTimezone"
                    },
                    type: "datetime",
                    validation: [],
                    _id: "1e542PkJHp"
                }
            ],
            formId: "65b189f16f69800008e6161b",
            GSI1_PK: "T#root#L#en-US#FB#F#65b189f16f69800008e6161b",
            GSI1_SK: "1",
            id: "65b189f16f69800008e6161b#0001",
            locale: "en-US",
            locked: false,
            name: "Demo Form 5",
            ownedBy: user,
            published: false,
            savedOn: "2024-01-24T22:13:12.913Z",
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
            slug: "demo-form-5-65b189f16f69800008e6161b",
            stats: {
                submissions: 0,
                views: 0
            },
            status: "draft",
            steps: [
                {
                    layout: [
                        ["NZWPSHZRIN"],
                        ["vxI0OE-flE"],
                        ["1om83kly5s", "9L3Wgow6-b"],
                        ["2gUedk4Aa1"],
                        ["tiR3t0uctA", "W99qOcY4ie"],
                        ["1e542PkJHp"]
                    ],
                    title: "Step 1"
                }
            ],
            tenant: "root",
            TYPE: "fb.form",
            version: 1,
            webinyVersion: "0.0.0",
            _ct: "2024-01-24T22:13:12.945Z",
            _et: "FormBuilderForm",
            _md: "2024-01-24T22:13:12.945Z"
        },
        {
            PK: "T#root#L#en-US#FB#F#L",
            SK: "65b189f16f69800008e6161b",
            createdBy: user,
            createdOn: "2024-01-24T22:06:41.291Z",
            fields: [
                {
                    fieldId: "hiddenField",
                    helpText: "Hidden Field - Help Text",
                    label: "Hidden Field",
                    name: "hidden",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: "Hidden Field - Default Value"
                    },
                    type: "hidden",
                    validation: [],
                    _id: "NZWPSHZRIN"
                },
                {
                    fieldId: "selectField",
                    helpText: "Select Field - Help Text",
                    label: "Select Field",
                    name: "select",
                    options: [
                        {
                            label: "Option 1",
                            value: "option1"
                        },
                        {
                            label: "Option 2",
                            value: "option2"
                        },
                        {
                            label: "Option 3",
                            value: "option3"
                        }
                    ],
                    placeholderText: "Select Field - Help Text",
                    settings: {
                        defaultValue: "option2"
                    },
                    type: "select",
                    validation: [],
                    _id: "vxI0OE-flE"
                },
                {
                    fieldId: "shortText",
                    helpText: "Short Text - Help Text",
                    label: "Short Text",
                    name: "text",
                    options: [],
                    placeholderText: "Short Text - Placeholder Text",
                    settings: {
                        defaultValue: "Short Text - Default Value"
                    },
                    type: "text",
                    validation: [
                        {
                            message: "Value is too short.",
                            name: "minLength",
                            settings: {
                                value: "1"
                            }
                        },
                        {
                            message: "Value is too long.",
                            name: "maxLength",
                            settings: {
                                value: "6"
                            }
                        }
                    ],
                    _id: "1om83kly5s"
                },
                {
                    fieldId: "longText",
                    helpText: "Long Text - Help Text",
                    label: "Long Text",
                    name: "textarea",
                    options: [],
                    placeholderText: "Long Text - Placeholder Text",
                    settings: {
                        defaultValue: "Long Text - Default Text",
                        rows: "10"
                    },
                    type: "textarea",
                    validation: [],
                    _id: "9L3Wgow6-b"
                },
                {
                    fieldId: "numberField",
                    helpText: "Number Field - Help Text",
                    label: "Number Field",
                    name: "number",
                    options: [],
                    placeholderText: "Number Field - Placeholder Text",
                    settings: {
                        defaultValue: null
                    },
                    type: "number",
                    validation: [],
                    _id: "2gUedk4Aa1"
                },
                {
                    fieldId: "radioField",
                    helpText: "Radio Field - Help Text",
                    label: "Radio Field",
                    name: "radio",
                    options: [
                        {
                            label: "Option 1",
                            value: "option1"
                        },
                        {
                            label: "Option 2",
                            value: "option2"
                        },
                        {
                            label: "Option 3",
                            value: "option3"
                        }
                    ],
                    placeholderText: null,
                    settings: {
                        defaultValue: "option2",
                        otherOption: true
                    },
                    type: "radio",
                    validation: [],
                    _id: "tiR3t0uctA"
                },
                {
                    fieldId: "checkboxField",
                    helpText: "Checkbox Field - Help Text",
                    label: "Checkbox Field",
                    name: "checkbox",
                    options: [
                        {
                            label: "Option 1",
                            value: "option1"
                        },
                        {
                            label: "Option 2",
                            value: "option2"
                        },
                        {
                            label: "Option 3",
                            value: "option3"
                        }
                    ],
                    placeholderText: null,
                    settings: {
                        defaultValue: ["option3"],
                        otherOption: true
                    },
                    type: "checkbox",
                    validation: [],
                    _id: "W99qOcY4ie"
                },
                {
                    fieldId: "dateTimeField",
                    helpText: "DateTime Field - Help Text",
                    label: "DateTime Field",
                    name: "date",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null,
                        format: "dateTimeWithTimezone"
                    },
                    type: "datetime",
                    validation: [],
                    _id: "1e542PkJHp"
                }
            ],
            formId: "65b189f16f69800008e6161b",
            id: "65b189f16f69800008e6161b#0001",
            locale: "en-US",
            locked: false,
            name: "Demo Form 5",
            ownedBy: user,
            published: false,
            savedOn: "2024-01-24T22:13:12.913Z",
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
            slug: "demo-form-5-65b189f16f69800008e6161b",
            stats: {
                submissions: 0,
                views: 0
            },
            status: "draft",
            steps: [
                {
                    layout: [
                        ["NZWPSHZRIN"],
                        ["vxI0OE-flE"],
                        ["1om83kly5s", "9L3Wgow6-b"],
                        ["2gUedk4Aa1"],
                        ["tiR3t0uctA", "W99qOcY4ie"],
                        ["1e542PkJHp"]
                    ],
                    title: "Step 1"
                }
            ],
            tenant: "root",
            TYPE: "fb.form.latest",
            version: 1,
            webinyVersion: "0.0.0",
            _ct: "2024-01-24T22:13:12.945Z",
            _et: "FormBuilderForm",
            _md: "2024-01-24T22:13:12.945Z"
        },

        // Form with custom settings
        {
            PK: "T#root#L#en-US#FB#F",
            SK: "65b18df865a46200087864f9#0001",
            createdBy: user,
            createdOn: "2024-01-24T22:23:52.364Z",
            fields: [
                {
                    fieldId: "demoField",
                    helpText: null,
                    label: "Demo Field",
                    name: "text",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [],
                    _id: "dMWqYyLYQV"
                }
            ],
            formId: "65b18df865a46200087864f9",
            GSI1_PK: "T#root#L#en-US#FB#F#65b18df865a46200087864f9",
            GSI1_SK: "1",
            id: "65b18df865a46200087864f9#0001",
            locale: "en-US",
            locked: false,
            name: "Demo Form 6",
            ownedBy: user,
            published: false,
            savedOn: "2024-01-24T22:26:03.138Z",
            settings: {
                fullWidthSubmitButton: true,
                layout: {
                    renderer: "default"
                },
                reCaptcha: {
                    enabled: true,
                    errorMessage: "Custom Captcha error message"
                },
                submitButtonLabel: "Custom submit button label",
                successMessage: [
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
                termsOfServiceMessage: {
                    enabled: true,
                    errorMessage: "Custom error message",
                    message: [
                        {
                            data: {
                                className: null,
                                text: "Custom term of service message",
                                textAlign: "start"
                            },
                            id: "kjBMY6NBnA",
                            type: "paragraph"
                        }
                    ]
                }
            },
            slug: "demo-form-6-65b18df865a46200087864f9",
            stats: {
                submissions: 0,
                views: 0
            },
            status: "draft",
            steps: [
                {
                    layout: [["dMWqYyLYQV"]],
                    title: "Step 1"
                }
            ],
            tenant: "root",
            TYPE: "fb.form",
            version: 1,
            webinyVersion: "0.0.0",
            _ct: "2024-01-24T22:26:03.155Z",
            _et: "FormBuilderForm",
            _md: "2024-01-24T22:26:03.155Z"
        },
        {
            PK: "T#root#L#en-US#FB#F#L",
            SK: "65b18df865a46200087864f9",
            createdBy: user,
            createdOn: "2024-01-24T22:23:52.364Z",
            fields: [
                {
                    fieldId: "demoField",
                    helpText: null,
                    label: "Demo Field",
                    name: "text",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [],
                    _id: "dMWqYyLYQV"
                }
            ],
            formId: "65b18df865a46200087864f9",
            id: "65b18df865a46200087864f9#0001",
            locale: "en-US",
            locked: false,
            name: "Demo Form 6",
            ownedBy: user,
            published: false,
            savedOn: "2024-01-24T22:26:03.138Z",
            settings: {
                fullWidthSubmitButton: true,
                layout: {
                    renderer: "default"
                },
                reCaptcha: {
                    enabled: true,
                    errorMessage: "Custom Captcha error message"
                },
                submitButtonLabel: "Custom submit button label",
                successMessage: [
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
                termsOfServiceMessage: {
                    enabled: true,
                    errorMessage: "Custom error message",
                    message: [
                        {
                            data: {
                                className: null,
                                text: "Custom term of service message",
                                textAlign: "start"
                            },
                            id: "kjBMY6NBnA",
                            type: "paragraph"
                        }
                    ]
                }
            },
            slug: "demo-form-6-65b18df865a46200087864f9",
            stats: {
                submissions: 0,
                views: 0
            },
            status: "draft",
            steps: [
                {
                    layout: [["dMWqYyLYQV"]],
                    title: "Step 1"
                }
            ],
            tenant: "root",
            TYPE: "fb.form.latest",
            version: 1,
            webinyVersion: "0.0.0",
            _ct: "2024-01-24T22:26:03.156Z",
            _et: "FormBuilderForm",
            _md: "2024-01-24T22:26:03.156Z"
        },

        // Form 1 from root tenant, locale de-DE
        {
            PK: "T#root#L#de-DE#FB#F#L",
            SK: "65b190cad481d800089f2479",
            createdBy: user,
            createdOn: "2024-01-24T22:35:54.384Z",
            fields: [
                {
                    fieldId: "demoField",
                    helpText: null,
                    label: "Demo Field",
                    name: "text",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [
                        {
                            message: "Value is required.",
                            name: "required",
                            settings: {}
                        }
                    ],
                    _id: "dV3wx0ForO"
                }
            ],
            formId: "65b190cad481d800089f2479",
            id: "65b190cad481d800089f2479#0001",
            locale: "de-DE",
            locked: true,
            name: "Demo Form 7",
            ownedBy: user,
            published: true,
            publishedOn: "2024-01-24T22:36:12.348Z",
            savedOn: "2024-01-24T22:36:12.348Z",
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
            slug: "demo-form-7-65b190cad481d800089f2479",
            stats: {
                submissions: 1000,
                views: 10000
            },
            status: "published",
            steps: [
                {
                    layout: [["dV3wx0ForO"]],
                    title: "Step 1"
                }
            ],
            tenant: "root",
            TYPE: "fb.form.latest",
            version: 1,
            webinyVersion: "0.0.0",
            _ct: "2024-01-24T22:36:12.362Z",
            _et: "FormBuilderForm",
            _md: "2024-01-24T22:36:12.362Z"
        },
        {
            PK: "T#root#L#de-DE#FB#F#LP",
            SK: "65b190cad481d800089f2479",
            createdBy: user,
            createdOn: "2024-01-24T22:35:54.384Z",
            fields: [
                {
                    fieldId: "demoField",
                    helpText: null,
                    label: "Demo Field",
                    name: "text",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [
                        {
                            message: "Value is required.",
                            name: "required",
                            settings: {}
                        }
                    ],
                    _id: "dV3wx0ForO"
                }
            ],
            formId: "65b190cad481d800089f2479",
            id: "65b190cad481d800089f2479#0001",
            locale: "de-DE",
            locked: true,
            name: "Demo Form 7",
            ownedBy: user,
            published: true,
            publishedOn: "2024-01-24T22:36:12.348Z",
            savedOn: "2024-01-24T22:36:12.348Z",
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
            slug: "demo-form-7-65b190cad481d800089f2479",
            stats: {
                submissions: 1000,
                views: 10000
            },
            status: "published",
            steps: [
                {
                    layout: [["dV3wx0ForO"]],
                    title: "Step 1"
                }
            ],
            tenant: "root",
            TYPE: "fb.form.latestPublished",
            version: 1,
            webinyVersion: "0.0.0",
            _ct: "2024-01-24T22:36:12.362Z",
            _et: "FormBuilderForm",
            _md: "2024-01-24T22:36:12.362Z"
        },
        {
            PK: "T#root#L#de-DE#FB#F",
            SK: "65b190cad481d800089f2479#0001",
            createdBy: user,
            createdOn: "2024-01-24T22:35:54.384Z",
            fields: [
                {
                    fieldId: "demoField",
                    helpText: null,
                    label: "Demo Field",
                    name: "text",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [
                        {
                            message: "Value is required.",
                            name: "required",
                            settings: {}
                        }
                    ],
                    _id: "dV3wx0ForO"
                }
            ],
            formId: "65b190cad481d800089f2479",
            GSI1_PK: "T#root#L#de-DE#FB#F#65b190cad481d800089f2479",
            GSI1_SK: "1",
            id: "65b190cad481d800089f2479#0001",
            locale: "de-DE",
            locked: true,
            name: "Demo Form 7",
            ownedBy: user,
            published: true,
            publishedOn: "2024-01-24T22:36:12.348Z",
            savedOn: "2024-01-24T22:36:12.348Z",
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
            slug: "demo-form-7-65b190cad481d800089f2479",
            stats: {
                submissions: 1000,
                views: 10000
            },
            status: "published",
            steps: [
                {
                    layout: [["dV3wx0ForO"]],
                    title: "Step 1"
                }
            ],
            tenant: "root",
            TYPE: "fb.form",
            version: 1,
            webinyVersion: "0.0.0",
            _ct: "2024-01-24T22:36:12.361Z",
            _et: "FormBuilderForm",
            _md: "2024-01-24T22:36:12.361Z"
        },

        // Form 1 from root tenant, locale fr-FR
        {
            PK: "T#root#L#fr-FR#FB#F#L",
            SK: "65b19428b583b90008e7a3bc",
            createdBy: user,
            createdOn: "2024-01-24T22:50:16.158Z",
            fields: [
                {
                    fieldId: "demoField",
                    helpText: null,
                    label: "Demo Field",
                    name: "text",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [],
                    _id: "njnnUb42N6"
                }
            ],
            formId: "65b19428b583b90008e7a3bc",
            id: "65b19428b583b90008e7a3bc#0001",
            locale: "fr-FR",
            locked: false,
            name: "Demo Form 8",
            ownedBy: user,
            published: false,
            savedOn: "2024-01-24T22:50:26.517Z",
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
            slug: "demo-form-8-65b19428b583b90008e7a3bc",
            stats: {
                submissions: 0,
                views: 0
            },
            status: "draft",
            steps: [
                {
                    layout: [["njnnUb42N6"]],
                    title: "Step 1"
                }
            ],
            tenant: "root",
            TYPE: "fb.form.latest",
            version: 1,
            webinyVersion: "0.0.0",
            _ct: "2024-01-24T22:50:26.538Z",
            _et: "FormBuilderForm",
            _md: "2024-01-24T22:50:26.538Z"
        },
        {
            PK: "T#root#L#fr-FR#FB#F",
            SK: "65b19428b583b90008e7a3bc#0001",
            createdBy: user,
            createdOn: "2024-01-24T22:50:16.158Z",
            fields: [
                {
                    fieldId: "demoField",
                    helpText: null,
                    label: "Demo Field",
                    name: "text",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [],
                    _id: "njnnUb42N6"
                }
            ],
            formId: "65b19428b583b90008e7a3bc",
            GSI1_PK: "T#root#L#fr-FR#FB#F#65b19428b583b90008e7a3bc",
            GSI1_SK: "1",
            id: "65b19428b583b90008e7a3bc#0001",
            locale: "fr-FR",
            locked: false,
            name: "Demo Form 8",
            ownedBy: user,
            published: false,
            savedOn: "2024-01-24T22:50:26.517Z",
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
            slug: "demo-form-8-65b19428b583b90008e7a3bc",
            stats: {
                submissions: 0,
                views: 0
            },
            status: "draft",
            steps: [
                {
                    layout: [["njnnUb42N6"]],
                    title: "Step 1"
                }
            ],
            tenant: "root",
            TYPE: "fb.form",
            version: 1,
            webinyVersion: "0.0.0",
            _ct: "2024-01-24T22:50:26.537Z",
            _et: "FormBuilderForm",
            _md: "2024-01-24T22:50:26.537Z"
        },

        // Form 2 from root tenant, locale de-DE
        {
            PK: "T#root#L#de-DE#FB#F#LP",
            SK: "65b2050e264766000809d7aa",
            createdBy: user,
            createdOn: "2024-01-25T06:52:56.840Z",
            fields: [
                {
                    fieldId: "demoField",
                    helpText: null,
                    label: "Demo Field",
                    name: "text",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [
                        {
                            message: "Value is required.",
                            name: "required",
                            settings: {}
                        }
                    ],
                    _id: "1vzUX-cmPP"
                }
            ],
            formId: "65b2050e264766000809d7aa",
            id: "65b2050e264766000809d7aa#0002",
            locale: "de-DE",
            locked: true,
            name: "Demo Form 9",
            ownedBy: user,
            published: true,
            publishedOn: "2024-01-25T06:53:03.955Z",
            savedOn: "2024-01-25T06:53:03.955Z",
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
            slug: "demo-form-9-65b2050e264766000809d7aa",
            stats: {
                submissions: 0,
                views: 0
            },
            status: "published",
            steps: [
                {
                    layout: [["1vzUX-cmPP"]],
                    title: "Step 1"
                }
            ],
            tenant: "root",
            TYPE: "fb.form.latestPublished",
            version: 2,
            webinyVersion: "0.0.0",
            _ct: "2024-01-25T06:53:04.001Z",
            _et: "FormBuilderForm",
            _md: "2024-01-25T06:53:04.001Z"
        },
        {
            PK: "T#root#L#de-DE#FB#F#L",
            SK: "65b2050e264766000809d7aa",
            createdBy: user,
            createdOn: "2024-01-25T06:52:56.840Z",
            fields: [
                {
                    fieldId: "demoField",
                    helpText: null,
                    label: "Demo Field",
                    name: "text",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [
                        {
                            message: "Value is required.",
                            name: "required",
                            settings: {}
                        }
                    ],
                    _id: "1vzUX-cmPP"
                }
            ],
            formId: "65b2050e264766000809d7aa",
            id: "65b2050e264766000809d7aa#0002",
            locale: "de-DE",
            locked: true,
            name: "Demo Form 9",
            ownedBy: user,
            published: true,
            publishedOn: "2024-01-25T06:53:03.955Z",
            savedOn: "2024-01-25T06:53:03.955Z",
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
            slug: "demo-form-9-65b2050e264766000809d7aa",
            stats: {
                submissions: 0,
                views: 0
            },
            status: "published",
            steps: [
                {
                    layout: [["1vzUX-cmPP"]],
                    title: "Step 1"
                }
            ],
            tenant: "root",
            TYPE: "fb.form.latest",
            version: 2,
            webinyVersion: "0.0.0",
            _ct: "2024-01-25T06:53:04.001Z",
            _et: "FormBuilderForm",
            _md: "2024-01-25T06:53:04.001Z"
        },
        {
            PK: "T#root#L#de-DE#FB#F",
            SK: "65b2050e264766000809d7aa#0001",
            createdBy: user,
            createdOn: "2024-01-25T06:51:58.036Z",
            fields: [
                {
                    fieldId: "demoField",
                    helpText: null,
                    label: "Demo Field",
                    name: "text",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [],
                    _id: "1vzUX-cmPP"
                }
            ],
            formId: "65b2050e264766000809d7aa",
            GSI1_PK: "T#root#L#de-DE#FB#F#65b2050e264766000809d7aa",
            GSI1_SK: "1",
            id: "65b2050e264766000809d7aa#0001",
            locale: "de-DE",
            locked: true,
            name: "Demo Form 9",
            ownedBy: user,
            published: true,
            publishedOn: "2024-01-25T06:52:51.920Z",
            savedOn: "2024-01-25T06:52:51.920Z",
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
            slug: "demo-form-9-65b2050e264766000809d7aa",
            stats: {
                submissions: 100,
                views: 1000
            },
            status: "published",
            steps: [
                {
                    layout: [["1vzUX-cmPP"]],
                    title: "Step 1"
                }
            ],
            tenant: "root",
            TYPE: "fb.form",
            version: 1,
            webinyVersion: "0.0.0",
            _ct: "2024-01-25T06:52:51.995Z",
            _et: "FormBuilderForm",
            _md: "2024-01-25T06:52:51.995Z"
        },
        {
            PK: "T#root#L#de-DE#FB#F",
            SK: "65b2050e264766000809d7aa#0002",
            createdBy: user,
            createdOn: "2024-01-25T06:52:56.840Z",
            fields: [
                {
                    fieldId: "demoField",
                    helpText: null,
                    label: "Demo Field",
                    name: "text",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [
                        {
                            message: "Value is required.",
                            name: "required",
                            settings: {}
                        }
                    ],
                    _id: "1vzUX-cmPP"
                }
            ],
            formId: "65b2050e264766000809d7aa",
            GSI1_PK: "T#root#L#de-DE#FB#F#65b2050e264766000809d7aa",
            GSI1_SK: "2",
            id: "65b2050e264766000809d7aa#0002",
            locale: "de-DE",
            locked: true,
            name: "Demo Form 9",
            ownedBy: user,
            published: true,
            publishedOn: "2024-01-25T06:53:03.955Z",
            savedOn: "2024-01-25T06:53:03.955Z",
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
            slug: "demo-form-9-65b2050e264766000809d7aa",
            stats: {
                submissions: 0,
                views: 0
            },
            status: "published",
            steps: [
                {
                    layout: [["1vzUX-cmPP"]],
                    title: "Step 1"
                }
            ],
            tenant: "root",
            TYPE: "fb.form",
            version: 2,
            webinyVersion: "0.0.0",
            _ct: "2024-01-25T06:53:04.001Z",
            _et: "FormBuilderForm",
            _md: "2024-01-25T06:53:04.001Z"
        },

        // Form 1 from otherTenant, locale fr-FR
        {
            PK: "T#otherTenant#L#fr-FR#FB#F#L",
            SK: "65b20b8f0321db00083d35c1",
            createdBy: user,
            createdOn: "2024-01-25T07:19:43.219Z",
            fields: [
                {
                    fieldId: "demoField",
                    helpText: null,
                    label: "Demo Field",
                    name: "text",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [],
                    _id: "EBPeRi4u0Z"
                }
            ],
            formId: "65b20b8f0321db00083d35c1",
            id: "65b20b8f0321db00083d35c1#0001",
            locale: "fr-FR",
            locked: false,
            name: "Demo Form 10",
            ownedBy: user,
            published: false,
            savedOn: "2024-01-25T07:19:51.052Z",
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
            slug: "demo-form-10-65b20b8f0321db00083d35c1",
            stats: {
                submissions: 0,
                views: 0
            },
            status: "draft",
            steps: [
                {
                    layout: [["EBPeRi4u0Z"]],
                    title: "Step 1"
                }
            ],
            tenant: "otherTenant",
            TYPE: "fb.form.latest",
            version: 1,
            webinyVersion: "0.0.0",
            _ct: "2024-01-25T07:19:51.076Z",
            _et: "FormBuilderForm",
            _md: "2024-01-25T07:19:51.076Z"
        },
        {
            PK: "T#otherTenant#L#fr-FR#FB#F",
            SK: "65b20b8f0321db00083d35c1#0001",
            createdBy: user,
            createdOn: "2024-01-25T07:19:43.219Z",
            fields: [
                {
                    fieldId: "demoField",
                    helpText: null,
                    label: "Demo Field",
                    name: "text",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [],
                    _id: "EBPeRi4u0Z"
                }
            ],
            formId: "65b20b8f0321db00083d35c1",
            GSI1_PK: "T#otherTenant#L#fr-FR#FB#F#65b20b8f0321db00083d35c1",
            GSI1_SK: "1",
            id: "65b20b8f0321db00083d35c1#0001",
            locale: "fr-FR",
            locked: false,
            name: "Demo Form 10",
            ownedBy: user,
            published: false,
            savedOn: "2024-01-25T07:19:51.052Z",
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
            slug: "demo-form-10-65b20b8f0321db00083d35c1",
            stats: {
                submissions: 0,
                views: 0
            },
            status: "draft",
            steps: [
                {
                    layout: [["EBPeRi4u0Z"]],
                    title: "Step 1"
                }
            ],
            tenant: "otherTenant",
            TYPE: "fb.form",
            version: 1,
            webinyVersion: "0.0.0",
            _ct: "2024-01-25T07:19:51.075Z",
            _et: "FormBuilderForm",
            _md: "2024-01-25T07:19:51.075Z"
        },

        // Form 2 from otherTenant, locale fr-FR
        {
            PK: "T#otherTenant#L#fr-FR#FB#F#LP",
            SK: "65b20bc00321db00083d35c9",
            createdBy: user,
            createdOn: "2024-01-25T07:20:32.550Z",
            fields: [
                {
                    fieldId: "demoField",
                    helpText: null,
                    label: "Demo Field",
                    name: "text",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [],
                    _id: "tk4jYhc8DI"
                }
            ],
            formId: "65b20bc00321db00083d35c9",
            id: "65b20bc00321db00083d35c9#0001",
            locale: "fr-FR",
            locked: true,
            name: "Demo Form 11",
            ownedBy: user,
            published: true,
            publishedOn: "2024-01-25T07:20:49.543Z",
            savedOn: "2024-01-25T07:20:49.543Z",
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
            slug: "demo-form-11-65b20bc00321db00083d35c9",
            stats: {
                submissions: 500,
                views: 1000
            },
            status: "published",
            steps: [
                {
                    layout: [["tk4jYhc8DI"]],
                    title: "Step 1"
                }
            ],
            tenant: "otherTenant",
            TYPE: "fb.form.latestPublished",
            version: 1,
            webinyVersion: "0.0.0",
            _ct: "2024-01-25T07:20:49.553Z",
            _et: "FormBuilderForm",
            _md: "2024-01-25T07:20:49.553Z"
        },
        {
            PK: "T#otherTenant#L#fr-FR#FB#F#L",
            SK: "65b20bc00321db00083d35c9",
            createdBy: user,
            createdOn: "2024-01-25T07:20:32.550Z",
            fields: [
                {
                    fieldId: "demoField",
                    helpText: null,
                    label: "Demo Field",
                    name: "text",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [],
                    _id: "tk4jYhc8DI"
                }
            ],
            formId: "65b20bc00321db00083d35c9",
            id: "65b20bc00321db00083d35c9#0001",
            locale: "fr-FR",
            locked: true,
            name: "Demo Form 11",
            ownedBy: user,
            published: true,
            publishedOn: "2024-01-25T07:20:49.543Z",
            savedOn: "2024-01-25T07:20:49.543Z",
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
            slug: "demo-form-11-65b20bc00321db00083d35c9",
            stats: {
                submissions: 500,
                views: 1000
            },
            status: "published",
            steps: [
                {
                    layout: [["tk4jYhc8DI"]],
                    title: "Step 1"
                }
            ],
            tenant: "otherTenant",
            TYPE: "fb.form.latest",
            version: 1,
            webinyVersion: "0.0.0",
            _ct: "2024-01-25T07:20:49.553Z",
            _et: "FormBuilderForm",
            _md: "2024-01-25T07:20:49.553Z"
        },
        {
            PK: "T#otherTenant#L#fr-FR#FB#F",
            SK: "65b20bc00321db00083d35c9#0001",
            createdBy: user,
            createdOn: "2024-01-25T07:20:32.550Z",
            fields: [
                {
                    fieldId: "demoField",
                    helpText: null,
                    label: "Demo Field",
                    name: "text",
                    options: [],
                    placeholderText: null,
                    settings: {
                        defaultValue: null
                    },
                    type: "text",
                    validation: [],
                    _id: "tk4jYhc8DI"
                }
            ],
            formId: "65b20bc00321db00083d35c9",
            GSI1_PK: "T#otherTenant#L#fr-FR#FB#F#65b20bc00321db00083d35c9",
            GSI1_SK: "1",
            id: "65b20bc00321db00083d35c9#0001",
            locale: "fr-FR",
            locked: true,
            name: "Demo Form 11",
            ownedBy: user,
            published: true,
            publishedOn: "2024-01-25T07:20:49.543Z",
            savedOn: "2024-01-25T07:20:49.543Z",
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
            slug: "demo-form-11-65b20bc00321db00083d35c9",
            stats: {
                submissions: 500,
                views: 1000
            },
            status: "published",
            steps: [
                {
                    layout: [["tk4jYhc8DI"]],
                    title: "Step 1"
                }
            ],
            tenant: "otherTenant",
            TYPE: "fb.form",
            version: 1,
            webinyVersion: "0.0.0",
            _ct: "2024-01-25T07:20:49.553Z",
            _et: "FormBuilderForm",
            _md: "2024-01-25T07:20:49.553Z"
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
