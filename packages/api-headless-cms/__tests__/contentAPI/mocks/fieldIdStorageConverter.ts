import { CmsEntry, CmsModel, CmsModelField } from "~/types";
import lodashCamelCase from "lodash/camelCase";

const createModelField = (
    base: Partial<CmsModelField> & Pick<CmsModelField, "fieldId" | "type">
): CmsModelField => {
    const { fieldId, type } = base;
    const id = base.id || `${fieldId}Id`;
    return {
        settings: {},
        ...base,
        id,
        fieldId,
        type,
        label: lodashCamelCase(fieldId),
        storageId: `${type}@${id}`
    };
};

const createModelFields = (): CmsModelField[] => {
    return [
        createModelField({
            fieldId: "name",
            type: "text"
        }),
        createModelField({
            fieldId: "nameUndefined",
            type: "text"
        }),
        createModelField({
            fieldId: "nameEmpty",
            type: "text"
        }),
        createModelField({
            fieldId: "age",
            type: "number"
        }),
        createModelField({
            fieldId: "ageEmpty",
            type: "number"
        }),
        createModelField({
            fieldId: "ageUndefined",
            type: "number"
        }),
        createModelField({
            fieldId: "isImportant",
            type: "boolean"
        }),
        createModelField({
            fieldId: "isImportantEmpty",
            type: "boolean"
        }),
        createModelField({
            fieldId: "isImportantUndefined",
            type: "boolean"
        }),
        createModelField({
            fieldId: "dateOfBirth",
            type: "datetime",
            settings: {
                type: "date"
            }
        }),
        createModelField({
            fieldId: "dateOfBirthEmpty",
            type: "datetime",
            settings: {
                type: "date"
            }
        }),
        createModelField({
            fieldId: "dateOfBirthUndefined",
            type: "datetime",
            settings: {
                type: "date"
            }
        }),
        createModelField({
            fieldId: "timeOfSleep",
            type: "datetime",
            settings: {
                type: "time"
            }
        }),
        createModelField({
            fieldId: "timeOfSleepUndefined",
            type: "datetime",
            settings: {
                type: "time"
            }
        }),
        createModelField({
            fieldId: "image",
            type: "file"
        }),
        createModelField({
            fieldId: "imageUndefined",
            type: "file"
        }),
        createModelField({
            fieldId: "images",
            type: "file",
            multipleValues: true
        }),
        createModelField({
            fieldId: "imagesUndefined",
            type: "file",
            multipleValues: true
        }),
        createModelField({
            fieldId: "description",
            type: "long-text"
        }),
        createModelField({
            fieldId: "descriptionUndefined",
            type: "long-text"
        }),
        createModelField({
            fieldId: "body",
            type: "rich-text"
        }),
        createModelField({
            fieldId: "bodyUndefined",
            type: "rich-text"
        }),
        createModelField({
            fieldId: "category",
            type: "ref"
        }),
        createModelField({
            fieldId: "categoryUndefined",
            type: "ref"
        }),
        createModelField({
            fieldId: "myObject",
            type: "object",
            settings: {
                fields: [
                    createModelField({
                        type: "text",
                        fieldId: "title"
                    }),
                    createModelField({
                        type: "text",
                        fieldId: "titleEmpty"
                    }),
                    createModelField({
                        type: "long-text",
                        fieldId: "description"
                    }),
                    createModelField({
                        type: "rich-text",
                        fieldId: "body"
                    }),
                    createModelField({
                        type: "number",
                        fieldId: "age"
                    }),
                    createModelField({
                        type: "boolean",
                        fieldId: "isImportant"
                    }),
                    createModelField({
                        type: "datetime",
                        settings: {
                            type: "date"
                        },
                        fieldId: "dateOfBirth"
                    }),
                    createModelField({
                        type: "datetime",
                        settings: {
                            type: "time"
                        },
                        fieldId: "timeWakingUp"
                    }),
                    createModelField({
                        type: "datetime",
                        settings: {
                            type: "dateTimeWithTimezone"
                        },
                        fieldId: "dateTimeZ"
                    }),
                    createModelField({
                        type: "datetime",
                        settings: {
                            type: "dateTimeWithoutTimezone"
                        },
                        fieldId: "dateTime"
                    }),
                    createModelField({
                        type: "file",
                        fieldId: "image",
                        settings: {
                            imageOnly: true
                        }
                    }),
                    createModelField({
                        type: "file",
                        fieldId: "documents"
                    }),
                    createModelField({
                        type: "ref",
                        fieldId: "category"
                    }),
                    createModelField({
                        type: "ref",
                        fieldId: "categories"
                    }),
                    createModelField({
                        type: "object",
                        settings: {
                            fields: [
                                createModelField({
                                    type: "text",
                                    fieldId: "title"
                                }),
                                createModelField({
                                    type: "text",
                                    fieldId: "titleEmpty"
                                })
                            ]
                        },
                        fieldId: "myChildObject"
                    }),
                    createModelField({
                        type: "object",
                        settings: {
                            fields: [
                                createModelField({
                                    type: "text",
                                    fieldId: "title"
                                })
                            ]
                        },
                        fieldId: "myChildObjectEmpty"
                    }),
                    createModelField({
                        type: "object",
                        multipleValues: true,
                        fieldId: "myObjectOptions",
                        settings: {
                            fields: [
                                createModelField({
                                    type: "text",
                                    multipleValues: false,
                                    fieldId: "titleInMyObjectOptions"
                                }),
                                createModelField({
                                    type: "text",
                                    multipleValues: false,
                                    fieldId: "titleEmptyInMyObjectOptions"
                                }),
                                createModelField({
                                    type: "number",
                                    multipleValues: true,
                                    fieldId: "valuesInMyObjectOptions"
                                })
                            ]
                        }
                    }),
                    createModelField({
                        type: "object",
                        multipleValues: true,
                        fieldId: "myObjectOptionsEmpty",
                        settings: {
                            fields: [
                                createModelField({
                                    type: "text",
                                    multipleValues: false,
                                    fieldId: "titleInMyObjectOptions"
                                }),
                                createModelField({
                                    type: "number",
                                    multipleValues: true,
                                    fieldId: "valuesInMyObjectOptions"
                                })
                            ]
                        }
                    })
                ]
            }
        }),
        createModelField({
            fieldId: "myObjectUndefined",
            type: "object",
            settings: {
                fields: [
                    createModelField({
                        type: "text",
                        fieldId: "title"
                    }),
                    createModelField({
                        type: "long-text",
                        fieldId: "description"
                    }),
                    createModelField({
                        type: "rich-text",
                        fieldId: "body"
                    }),
                    createModelField({
                        type: "number",
                        fieldId: "age"
                    }),
                    createModelField({
                        type: "boolean",
                        fieldId: "isImportant"
                    }),
                    createModelField({
                        type: "datetime",
                        settings: {
                            type: "date"
                        },
                        fieldId: "dateOfBirth"
                    }),
                    createModelField({
                        type: "datetime",
                        settings: {
                            type: "time"
                        },
                        fieldId: "timeWakingUp"
                    }),
                    createModelField({
                        type: "datetime",
                        settings: {
                            type: "dateTimeWithTimezone"
                        },
                        fieldId: "dateTimeZ"
                    }),
                    createModelField({
                        type: "datetime",
                        settings: {
                            type: "dateTimeWithoutTimezone"
                        },
                        fieldId: "dateTime"
                    }),
                    createModelField({
                        type: "file",
                        fieldId: "image",
                        settings: {
                            imageOnly: true
                        }
                    }),
                    createModelField({
                        type: "file",
                        fieldId: "documents"
                    }),
                    createModelField({
                        type: "ref",
                        fieldId: "category"
                    }),
                    createModelField({
                        type: "ref",
                        fieldId: "categories"
                    }),
                    createModelField({
                        type: "object",
                        settings: {
                            fields: [
                                createModelField({
                                    type: "text",
                                    fieldId: "title"
                                })
                            ]
                        },
                        fieldId: "myChildObject"
                    }),
                    createModelField({
                        type: "object",
                        multipleValues: true,
                        fieldId: "myObjectOptions",
                        settings: {
                            fields: [
                                createModelField({
                                    type: "text",
                                    multipleValues: false,
                                    fieldId: "titleInMyObjectOptions"
                                }),
                                createModelField({
                                    type: "number",
                                    multipleValues: true,
                                    fieldId: "valuesInMyObjectOptions"
                                })
                            ]
                        }
                    })
                ]
            }
        }),
        createModelField({
            fieldId: "myObjectList",
            type: "object",
            multipleValues: true,
            settings: {
                fields: [
                    createModelField({
                        type: "text",
                        fieldId: "title"
                    }),
                    createModelField({
                        type: "object",
                        settings: {
                            fields: [
                                createModelField({
                                    type: "text",
                                    fieldId: "titleInRepeatableObjectsObject"
                                })
                            ]
                        },
                        fieldId: "myChildObjectInRepeatable"
                    }),
                    createModelField({
                        type: "object",
                        multipleValues: true,
                        fieldId: "myObjectListOptions",
                        settings: {
                            fields: [
                                createModelField({
                                    type: "text",
                                    multipleValues: false,
                                    fieldId: "titleInMyObjectListOptions"
                                }),
                                createModelField({
                                    type: "number",
                                    multipleValues: true,
                                    fieldId: "valuesInMyObjectListOptions"
                                })
                            ]
                        }
                    })
                ]
            }
        })
    ];
};

export const createModel = (base?: Partial<Omit<CmsModel, "fields" | "layout">>): CmsModel => {
    const fields = createModelFields();
    return {
        name: "Test model",
        titleFieldId: fields[0].fieldId,
        group: {
            id: "group-id",
            name: "Group name"
        },
        description: "",
        modelId: "test",
        layout: fields.map(field => {
            return [field.id];
        }),
        webinyVersion: "5.50.0",
        locale: "en-US",
        tenant: "root",
        ...(base || {}),
        fields
    };
};

const createRawValues = () => {
    return {
        name: "John Doe",
        nameEmpty: "",
        age: 45,
        ageEmpty: 0,
        isImportant: true,
        isImportantEmpty: false,
        dateOfBirth: "2022-06-08",
        dateOfBirthEmpty: null,
        timeOfSleep: "11:12:13",
        image: "https://dkz8lew0z0heu.cloudfront.net/files/9l7u8bvz1-Screenshot2022-09-08at11.13.58.png",
        images: [
            "https://dkz8lew0z0heu.cloudfront.net/files/9l7u8bvz1-Screenshot2022-09-08at11.13.58.png",
            "https://dkz8lew0z0heu.cloudfront.net/files/9l7u8bvz1-Screenshot2022-09-08at11.13.59.png",
            "https://dkz8lew0z0heu.cloudfront.net/files/9l7u8bvz1-Screenshot2022-09-08at11.14.00.png"
        ],
        description: "Description text",
        body: [
            {
                id: "viUwgCKdKI",
                type: "paragraph",
                data: {
                    text: "Body Text",
                    textAlign: "start",
                    className: ""
                }
            }
        ],
        category: {
            modelId: "category",
            id: "6319b7b95d26da000918db7f#0003"
        },
        myObject: {
            title: "Title In Object",
            description: "Description In Object",
            body: [
                {
                    id: "WNaw9DNhDu",
                    type: "paragraph",
                    data: {
                        text: "Body In Object",
                        textAlign: "start",
                        className: ""
                    }
                }
            ],
            age: "10",
            isImportant: false,
            dateOfBirth: "2022-09-01",
            timeWakingUp: "12:13:14",
            dateTimeZ: "2022-09-09T10:42:42+02:00",
            dateTime: "2022-09-09 10:42:42",
            image: "https://dkz8lew0z0heu.cloudfront.net/files/9l7u8bvz1-Screenshot2022-09-08at11.13.58.png",
            documents: [
                "https://dkz8lew0z0heu.cloudfront.net/files/9l7u8dww3-Screenshot2022-08-31at09.29.10.png",
                "https://dkz8lew0z0heu.cloudfront.net/files/9l7u8bvz1-Screenshot2022-09-08at11.13.58.png",
                "https://dkz8lew0z0heu.cloudfront.net/files/9l7u8dwxk-Screenshot2022-08-31at09.29.08.png",
                "https://dkz8lew0z0heu.cloudfront.net/files/9l7u8dwxs-Screenshot2022-08-31at09.29.06.png"
            ],
            category: {
                modelId: "category",
                id: "6319b7b95d26da000918db7f#0003"
            },
            categories: [
                {
                    modelId: "category",
                    id: "6319b7b95d26da000918db7f#0003"
                },
                {
                    modelId: "category",
                    id: "6319b7ae5d26da000918db7e#0001"
                }
            ],
            myChildObject: {
                title: "Title In My Child Object"
            }
        },
        myObjectList: [
            {
                title: "Title In My Object List #1",
                myChildObjectInRepeatable: {
                    titleInRepeatableObjectsObject: "Title In My Object List Child Object #1"
                }
            },
            {
                title: "Title In My Object List #2",
                myChildObjectInRepeatable: {
                    titleInRepeatableObjectsObject: "Title In My Object List Child Object #2"
                }
            }
        ]
    };
};

const createStoredValues = () => {
    return {
        "text@nameId": "John Doe",
        "text@nameEmptyId": "",
        "number@ageId": 45,
        "number@ageEmptyId": 0,
        "boolean@isImportantId": true,
        "boolean@isImportantEmptyId": false,
        "datetime@dateOfBirthId": "2022-06-08",
        "datetime@dateOfBirthEmptyId": null,
        "datetime@timeOfSleepId": "11:12:13",
        "file@imageId":
            "https://dkz8lew0z0heu.cloudfront.net/files/9l7u8bvz1-Screenshot2022-09-08at11.13.58.png",
        "file@imagesId": [
            "https://dkz8lew0z0heu.cloudfront.net/files/9l7u8bvz1-Screenshot2022-09-08at11.13.58.png",
            "https://dkz8lew0z0heu.cloudfront.net/files/9l7u8bvz1-Screenshot2022-09-08at11.13.59.png",
            "https://dkz8lew0z0heu.cloudfront.net/files/9l7u8bvz1-Screenshot2022-09-08at11.14.00.png"
        ],
        "long-text@descriptionId": "Description text",
        "rich-text@bodyId": [
            {
                id: "viUwgCKdKI",
                type: "paragraph",
                data: {
                    text: "Body Text",
                    textAlign: "start",
                    className: ""
                }
            }
        ],
        "ref@categoryId": {
            modelId: "category",
            id: "6319b7b95d26da000918db7f#0003"
        },
        "object@myObjectId": {
            "text@titleId": "Title In Object",
            "long-text@descriptionId": "Description In Object",
            "rich-text@bodyId": [
                {
                    id: "WNaw9DNhDu",
                    type: "paragraph",
                    data: {
                        text: "Body In Object",
                        textAlign: "start",
                        className: ""
                    }
                }
            ],
            "number@ageId": "10",
            "boolean@isImportantId": false,
            "datetime@dateOfBirthId": "2022-09-01",
            "datetime@timeWakingUpId": "12:13:14",
            "datetime@dateTimeZId": "2022-09-09T10:42:42+02:00",
            "datetime@dateTimeId": "2022-09-09 10:42:42",
            "file@imageId":
                "https://dkz8lew0z0heu.cloudfront.net/files/9l7u8bvz1-Screenshot2022-09-08at11.13.58.png",
            "file@documentsId": [
                "https://dkz8lew0z0heu.cloudfront.net/files/9l7u8dww3-Screenshot2022-08-31at09.29.10.png",
                "https://dkz8lew0z0heu.cloudfront.net/files/9l7u8bvz1-Screenshot2022-09-08at11.13.58.png",
                "https://dkz8lew0z0heu.cloudfront.net/files/9l7u8dwxk-Screenshot2022-08-31at09.29.08.png",
                "https://dkz8lew0z0heu.cloudfront.net/files/9l7u8dwxs-Screenshot2022-08-31at09.29.06.png"
            ],
            "ref@categoryId": {
                modelId: "category",
                id: "6319b7b95d26da000918db7f#0003"
            },
            "ref@categoriesId": [
                {
                    modelId: "category",
                    id: "6319b7b95d26da000918db7f#0003"
                },
                {
                    modelId: "category",
                    id: "6319b7ae5d26da000918db7e#0001"
                }
            ],
            "object@myChildObjectId": {
                "text@titleId": "Title In My Child Object"
            }
        },
        "object@myObjectListId": [
            {
                "text@titleId": "Title In My Object List #1",
                "object@myChildObjectInRepeatableId": {
                    "text@titleInRepeatableObjectsObjectId":
                        "Title In My Object List Child Object #1"
                }
            },
            {
                "text@titleId": "Title In My Object List #2",
                "object@myChildObjectInRepeatableId": {
                    "text@titleInRepeatableObjectsObjectId":
                        "Title In My Object List Child Object #2"
                }
            }
        ]
    };
};

export const createStoredEntry = (): CmsEntry => {
    return createBaseEntry(createStoredValues());
};

export const createRawEntry = (): CmsEntry => {
    return createBaseEntry(createRawValues());
};

const createBaseEntry = (values: Record<string, any>): CmsEntry => {
    return {
        id: "someEntryId#0001",
        entryId: "someEntryId",
        createdBy: {
            id: "id",
            type: "admin",
            displayName: "Admin User"
        },
        ownedBy: {
            id: "id",
            type: "admin",
            displayName: "Admin User"
        },
        createdOn: "2022-09-01T12:00:00Z",
        savedOn: "2022-09-01T12:00:00Z",
        publishedOn: undefined,
        modelId: "test",
        locale: "en-US",
        tenant: "root",
        meta: {},
        locked: false,
        status: "draft",
        version: 1,
        webinyVersion: "w.w.w",
        values
    };
};
