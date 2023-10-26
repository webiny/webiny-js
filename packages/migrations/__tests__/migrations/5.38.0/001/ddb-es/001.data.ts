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
