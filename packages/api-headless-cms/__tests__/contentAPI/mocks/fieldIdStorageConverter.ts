import { CmsEntry, CmsModelField } from "~/types";
import lodashCamelCase from "lodash/camelCase";

const createModelField = (
    base: Partial<CmsModelField> & Pick<CmsModelField, "fieldId" | "type">
): CmsModelField => {
    const { fieldId, type } = base;
    const id = `${fieldId}Id`;
    return {
        ...base,
        id,
        fieldId,
        type,
        settings: {},
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
            fieldId: "age",
            type: "number"
        }),
        createModelField({
            fieldId: "isImportant",
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
            fieldId: "timeOfSleep",
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
            fieldId: "description",
            type: "long-text"
        }),
        createModelField({
            fieldId: "body",
            type: "rich-text"
        }),
        createModelField({
            fieldId: "category",
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
                    })
                ]
            }
        }),
        createModelField({
            fieldId: "myObjectList",
            type: "object",
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
                    })
                ]
            }
        })
    ];
};

export const createModel = (): CmsModel => {
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
        fields
    };
};

const createRawValues = () => {
    return {
        name: "John Doe",
        age: 45,
        isImportant: true,
        dateOfBirth: "2022-06-08",
        timeOfSleep: "11:12:13",
        image: "https://dkz8lew0z0heu.cloudfront.net/files/9l7u8bvz1-Screenshot2022-09-08at11.13.58.png",
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
                    title: "Title In My Object List Child Object #1"
                }
            },
            {
                title: "Title In My Object List #2",
                myChildObjectInRepeatable: {
                    title: "Title In My Object List Child Object #2"
                }
            }
        ]
    };
};

const createStoredValues = () => {
    return {
        "text@name": "John Doe",
        "number@age": 45,
        "boolean@isImportant": true,
        "datetime@dateOfBirth": "2022-06-08",
        "datetime@timeOfSleep": "11:12:13",
        "file@image":
            "https://dkz8lew0z0heu.cloudfront.net/files/9l7u8bvz1-Screenshot2022-09-08at11.13.58.png",
        "long-text@description": "Description text",
        "rich-text@body": [
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
        "ref@category": {
            modelId: "category",
            id: "6319b7b95d26da000918db7f#0003"
        },
        "object@myObject": {
            "text@title": "Title In Object",
            "long-text@description": "Description In Object",
            "rich-text@body": [
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
            "number@age": "10",
            "datetime@dateOfBirth": "2022-09-01",
            "datetime@timeWakingUp": "12:13:14",
            "datetime@dateTimeZ": "2022-09-09T10:42:42+02:00",
            "datetime@dateTime": "2022-09-09 10:42:42",
            "file@image":
                "https://dkz8lew0z0heu.cloudfront.net/files/9l7u8bvz1-Screenshot2022-09-08at11.13.58.png",
            "file@documents": [
                "https://dkz8lew0z0heu.cloudfront.net/files/9l7u8dww3-Screenshot2022-08-31at09.29.10.png",
                "https://dkz8lew0z0heu.cloudfront.net/files/9l7u8bvz1-Screenshot2022-09-08at11.13.58.png",
                "https://dkz8lew0z0heu.cloudfront.net/files/9l7u8dwxk-Screenshot2022-08-31at09.29.08.png",
                "https://dkz8lew0z0heu.cloudfront.net/files/9l7u8dwxs-Screenshot2022-08-31at09.29.06.png"
            ],
            "ref@category": {
                modelId: "category",
                id: "6319b7b95d26da000918db7f#0003"
            },
            "ref@categories": [
                {
                    modelId: "category",
                    id: "6319b7b95d26da000918db7f#0003"
                },
                {
                    modelId: "category",
                    id: "6319b7ae5d26da000918db7e#0001"
                }
            ],
            "object@myChildObject": {
                "text@title": "Title In My Child Object"
            }
        },
        "object@myObjectList": [
            {
                "text@title": "Title In My Object List #1",
                "object@myChildObjectInRepeatable": {
                    "text@title": "Title In My Object List Child Object #1"
                }
            },
            {
                "text@title": "Title In My Object List #2",
                "object@myChildObjectInRepeatable": {
                    "text@title": "Title In My Object List Child Object #2"
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

const createBaseEntry = (values: any): CmsEntry => {
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
        publishedOn: null,
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
