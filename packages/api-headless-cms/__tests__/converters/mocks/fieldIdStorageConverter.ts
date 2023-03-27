import { CmsEntry, CmsModel, CmsModelField } from "~/types";
import {
    createTextField,
    createTextFieldEmpty,
    createTextFieldUndefined,
    createNumberField,
    createNumberFieldUndefined,
    createNumberFieldEmpty,
    createBooleanField,
    createBooleanFieldEmpty,
    createBooleanFieldUndefined,
    createDateField,
    createDateFieldEmpty,
    createTimeField,
    createDateFieldUndefined,
    createTimeFieldUndefined,
    createFileField,
    createFieldFieldMultipleUndefined,
    createFileFieldMultiple,
    createFileFieldUndefined,
    createLongTextField,
    createLongTextFieldUndefined,
    createRichTextField,
    createRichTextFieldUndefined,
    createRefField,
    createRefFieldUndefined,
    createObjectField,
    createObjectFieldMultiple,
    createObjectFieldUndefined,
    createDynamicZoneField,
    createDynamicZoneFieldMultiple
} from "./fields";

const createModelFields = (): CmsModelField[] => {
    return [
        // text
        createTextField(),
        createTextFieldUndefined(),
        createTextFieldEmpty(),
        // number
        createNumberField(),
        createNumberFieldUndefined(),
        createNumberFieldEmpty(),
        // boolean
        createBooleanField(),
        createBooleanFieldEmpty(),
        createBooleanFieldUndefined(),
        // datetime
        createDateField(),
        createDateFieldUndefined(),
        createDateFieldEmpty(),
        createTimeField(),
        createTimeFieldUndefined(),
        // file
        createFileField(),
        createFileFieldUndefined(),
        createFileFieldMultiple(),
        createFieldFieldMultipleUndefined(),
        // long-text
        createLongTextField(),
        createLongTextFieldUndefined(),
        // rich-text
        createRichTextField(),
        createRichTextFieldUndefined(),
        // ref
        createRefField(),
        createRefFieldUndefined(),
        // object
        createObjectField(),
        createObjectFieldUndefined(),
        createObjectFieldMultiple(),
        // dynamicZone
        createDynamicZoneField(),
        createDynamicZoneFieldMultiple()
    ];
};

export const createModel = (base?: Partial<Omit<CmsModel, "layout">>): CmsModel => {
    const fields = base?.fields || createModelFields();
    const titleFieldId = fields.find(field => {
        return field.type === "text";
    });
    return {
        name: "Test model",
        titleFieldId: titleFieldId?.fieldId || "id",
        singularApiName: "Test",
        pluralApiName: "Tests",
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
// TODO extract each field value to a file withing the fields directory
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
            },
            myObjectOptions: [
                {
                    titleInMyObjectOptions: "titleInMyObjectOptions text",
                    valuesInMyObjectOptions: 1234,
                    objectInMyObjectOptions: [
                        {
                            textInObjectInMyObjectOptions: ["textInObjectInMyObjectOptions text"],
                            numberInObjectInMyObjectOptions: [123456, 654321],
                            objectInObjectInMyObjectOptions: {
                                datetimeInObjectInObjectInMyObjectOptions: [
                                    "2022-09-01",
                                    "2022-09-02",
                                    "2022-09-03"
                                ]
                            }
                        }
                    ]
                }
            ]
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
        ],
        dynamicZoneArray: [
            {
                dzText: "Dynamic zone array title",
                dzObjectArray: [
                    {
                        titleInDzObjectArray: "Dynamic zone object array title"
                    }
                ],
                dzObject: {
                    titleInDzObject: "Dynamic zone object title"
                },
                _templateId: "dzTemplateArray1"
            }
        ],
        dynamicZoneObject: {
            dzText: "Dynamic zone object title",
            dzObjectArray: [
                {
                    titleInDzObjectArray: "Dynamic zone object array title"
                }
            ],
            dzObject: {
                titleInDzObject: "Dynamic zone object title"
            },
            _templateId: "dzTemplateObject1"
        }
    };
};
// TODO extract each field value to a file withing the fields directory
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
            },
            "object@myObjectOptionsId": [
                {
                    "text@titleInMyObjectOptionsId": "titleInMyObjectOptions text",
                    "number@valuesInMyObjectOptionsId": 1234,
                    "object@objectInMyObjectOptionsId": [
                        {
                            "text@textInObjectInMyObjectOptionsId": [
                                "textInObjectInMyObjectOptions text"
                            ],
                            "number@numberInObjectInMyObjectOptionsId": [123456, 654321],
                            "object@objectInObjectInMyObjectOptionsId": {
                                "datetime@datetimeInObjectInObjectInMyObjectOptionsId": [
                                    "2022-09-01",
                                    "2022-09-02",
                                    "2022-09-03"
                                ]
                            }
                        }
                    ]
                }
            ]
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
        ],
        "dynamicZone@dynamicZoneArrayId": [
            {
                "text@dzTextId": "Dynamic zone array title",
                "object@dzObjectArrayId": [
                    {
                        "text@titleInDzObjectArrayId": "Dynamic zone object array title"
                    }
                ],
                "object@dzObjectId": {
                    "text@titleInDzObjectId": "Dynamic zone object title"
                },
                _templateId: "dzTemplateArray1"
            }
        ],
        "dynamicZone@dynamicZoneObjectId": {
            "text@dzTextId": "Dynamic zone object title",
            "object@dzObjectArrayId": [
                {
                    "text@titleInDzObjectArrayId": "Dynamic zone object array title"
                }
            ],
            "object@dzObjectId": {
                "text@titleInDzObjectId": "Dynamic zone object title"
            },
            _templateId: "dzTemplateObject1"
        }
    };
};

export const createStoredEntry = (values?: Record<string, any>): CmsEntry => {
    return createBaseEntry(values || createStoredValues());
};

export const createRawEntry = (values?: Record<string, any>): CmsEntry => {
    return createBaseEntry(values || createRawValues());
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
