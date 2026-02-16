import type { CmsEntry, CmsModel, CmsModelField } from "~/types";
import { createModelField } from "./field";
import { createModel as createBaseModel } from "./model";

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
            list: true
        }),
        createModelField({
            fieldId: "imagesUndefined",
            type: "file",
            list: true
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
                        list: true,
                        fieldId: "myObjectOptions",
                        settings: {
                            fields: [
                                createModelField({
                                    type: "text",
                                    list: false,
                                    fieldId: "titleInMyObjectOptions"
                                }),
                                createModelField({
                                    type: "text",
                                    list: false,
                                    fieldId: "titleEmptyInMyObjectOptions"
                                }),
                                createModelField({
                                    type: "number",
                                    list: true,
                                    fieldId: "valuesInMyObjectOptions"
                                }),
                                createModelField({
                                    type: "object",
                                    list: true,
                                    fieldId: "objectInMyObjectOptions",
                                    settings: {
                                        /**
                                         * TODO THIS!
                                         * myObject.myObjectOptions.objectInMyObjectOptions
                                         */
                                        fields: [
                                            createModelField({
                                                type: "text",
                                                list: true,
                                                fieldId: "textInObjectInMyObjectOptions"
                                            }),
                                            createModelField({
                                                type: "number",
                                                list: true,
                                                fieldId: "numberInObjectInMyObjectOptions"
                                            }),
                                            createModelField({
                                                type: "object",
                                                list: false,
                                                fieldId: "objectInObjectInMyObjectOptions",
                                                settings: {
                                                    fields: [
                                                        createModelField({
                                                            type: "datetime",
                                                            settings: {
                                                                type: "dateOnly"
                                                            },
                                                            fieldId:
                                                                "datetimeInObjectInObjectInMyObjectOptions"
                                                        })
                                                    ]
                                                }
                                            })
                                        ]
                                    }
                                })
                            ]
                        }
                    }),
                    createModelField({
                        type: "object",
                        list: true,
                        fieldId: "myObjectOptionsEmpty",
                        settings: {
                            fields: [
                                createModelField({
                                    type: "text",
                                    list: false,
                                    fieldId: "titleInMyObjectOptions"
                                }),
                                createModelField({
                                    type: "number",
                                    list: true,
                                    fieldId: "valuesInMyObjectOptions"
                                })
                            ]
                        }
                    }),
                    createModelField({
                        type: "dynamicZone",
                        fieldId: "myObjectDz",
                        list: false,
                        settings: {
                            templates: [
                                {
                                    layout: [["myObjectDzRichText"]],
                                    name: "My Object DZ Template",
                                    gqlTypeName: "MyObjectDzTemplate",
                                    icon: {
                                        name: "fas/flag",
                                        type: "fas/flag"
                                    },
                                    id: "myObjectDzTemplate1",
                                    description: "",
                                    validation: [],
                                    fields: [
                                        createModelField({
                                            type: "rich-text",
                                            list: false,
                                            fieldId: "myObjectDzRichText"
                                        }),
                                        createModelField({
                                            type: "rich-text",
                                            list: true,
                                            fieldId: "myObjectDzRichTextMultiple"
                                        })
                                    ]
                                }
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
                        list: true,
                        fieldId: "myObjectOptions",
                        settings: {
                            fields: [
                                createModelField({
                                    type: "text",
                                    list: false,
                                    fieldId: "titleInMyObjectOptions"
                                }),
                                createModelField({
                                    type: "number",
                                    list: true,
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
            list: true,
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
                        list: true,
                        fieldId: "myObjectListOptions",
                        settings: {
                            fields: [
                                createModelField({
                                    type: "text",
                                    list: false,
                                    fieldId: "titleInMyObjectListOptions"
                                }),
                                createModelField({
                                    type: "number",
                                    list: true,
                                    fieldId: "valuesInMyObjectListOptions"
                                })
                            ]
                        }
                    })
                ]
            }
        }),
        createModelField({
            type: "dynamicZone",
            fieldId: "dynamicZoneArray",
            list: true,
            settings: {
                templates: [
                    {
                        layout: [
                            [
                                "dzText",
                                "dzObject",
                                "dzObjectArray",
                                "dzArrayRichText",
                                "dzArrayRichTextMultiple"
                            ]
                        ],
                        name: "DZ Text",
                        gqlTypeName: "DzTextObjectArray",
                        icon: {
                            type: "fas/flag",
                            name: "fas/flag",
                            value: "fas/flag"
                        },
                        validation: [],
                        description: "",
                        id: "dzTemplateArray1",
                        fields: [
                            createModelField({
                                fieldId: "dzText",
                                type: "text"
                            }),
                            createModelField({
                                type: "rich-text",
                                list: false,
                                fieldId: "dzArrayRichText"
                            }),
                            createModelField({
                                type: "rich-text",
                                list: true,
                                fieldId: "dzArrayRichTextMultiple"
                            }),
                            createModelField({
                                type: "object",
                                list: true,
                                fieldId: "dzObjectArray",
                                settings: {
                                    fields: [
                                        createModelField({
                                            type: "text",
                                            list: false,
                                            fieldId: "titleInDzObjectArray"
                                        })
                                    ]
                                }
                            }),
                            createModelField({
                                type: "object",
                                list: false,
                                fieldId: "dzObject",
                                settings: {
                                    fields: [
                                        createModelField({
                                            type: "text",
                                            list: false,
                                            fieldId: "titleInDzObject"
                                        })
                                    ]
                                }
                            })
                        ]
                    }
                ]
            }
        }),
        createModelField({
            type: "dynamicZone",
            fieldId: "dynamicZoneObject",
            list: false,
            settings: {
                templates: [
                    {
                        layout: [
                            [
                                "dzText",
                                "dzObject",
                                "dzObjectArray",
                                "dzObjectRichText",
                                "dzObjectRichTextMultiple"
                            ]
                        ],
                        name: "DZ Text",
                        gqlTypeName: "DzTextObject",
                        icon: {
                            type: "fas/flag",
                            name: "fas/flag",
                            value: "fas/flag"
                        },
                        description: "",
                        id: "dzTemplateObject1",
                        validation: [],
                        fields: [
                            createModelField({
                                fieldId: "dzText",
                                type: "text"
                            }),
                            createModelField({
                                type: "rich-text",
                                list: false,
                                fieldId: "dzObjectRichText"
                            }),
                            createModelField({
                                type: "rich-text",
                                list: true,
                                fieldId: "dzObjectRichTextMultiple"
                            }),
                            createModelField({
                                type: "object",
                                list: true,
                                fieldId: "dzObjectArray",
                                settings: {
                                    fields: [
                                        createModelField({
                                            type: "text",
                                            list: false,
                                            fieldId: "titleInDzObjectArray"
                                        })
                                    ]
                                }
                            }),
                            createModelField({
                                type: "object",
                                list: false,
                                fieldId: "dzObject",
                                settings: {
                                    fields: [
                                        createModelField({
                                            type: "text",
                                            list: false,
                                            fieldId: "titleInDzObject"
                                        })
                                    ]
                                }
                            })
                        ]
                    }
                ]
            }
        })
    ];
};

export const createModel = (base?: Partial<Omit<CmsModel, "fields" | "layout">>): CmsModel => {
    const fields = createModelFields();
    return createBaseModel({
        ...base,
        fields
    });
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
            ],
            myObjectDz: {
                _templateId: "myObjectDzTemplate1",
                myObjectDzRichText: "My Rich Text in My Object DZ",
                myObjectDzRichTextMultiple: ["My Rich Text Multiple 1", "My Rich Text Multiple 2"]
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
        ],
        dynamicZoneArray: [
            {
                dzText: "Dynamic zone array title",
                dzArrayRichText: "My Rich Text in DZ",
                dzArrayRichTextMultiple: ["My Rich Text Multiple 1", "My Rich Text Multiple 2"],
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
            dzObjectRichText: "My Rich Text in DZ",
            dzObjectRichTextMultiple: ["My Rich Text Multiple 1", "My Rich Text Multiple 2"],
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
            ],
            "dynamicZone@myObjectDzId": {
                _templateId: "myObjectDzTemplate1",
                "rich-text@myObjectDzRichTextId": "My Rich Text in My Object DZ",
                "rich-text@myObjectDzRichTextMultipleId": [
                    "My Rich Text Multiple 1",
                    "My Rich Text Multiple 2"
                ]
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
        ],
        "dynamicZone@dynamicZoneArrayId": [
            {
                "text@dzTextId": "Dynamic zone array title",
                "rich-text@dzArrayRichTextId": "My Rich Text in DZ",
                "rich-text@dzArrayRichTextMultipleId": [
                    "My Rich Text Multiple 1",
                    "My Rich Text Multiple 2"
                ],
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
            "rich-text@dzObjectRichTextId": "My Rich Text in DZ",
            "rich-text@dzObjectRichTextMultipleId": [
                "My Rich Text Multiple 1",
                "My Rich Text Multiple 2"
            ],
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

export const createStoredEntry = (): CmsEntry => {
    return createBaseEntry(createStoredValues());
};

export const createRawEntry = (): CmsEntry => {
    return createBaseEntry(createRawValues());
};

const createBaseEntry = (values: Record<string, any>): CmsEntry => {
    const identity = {
        id: "id",
        type: "admin",
        displayName: "Admin User"
    };
    return {
        id: "someEntryId#0001",
        entryId: "someEntryId",
        createdOn: "2022-09-01T12:00:00Z",
        savedOn: "2022-09-01T12:00:00Z",
        firstPublishedOn: null,
        lastPublishedOn: null,
        firstPublishedBy: null,
        revisionCreatedOn: "2022-09-01T12:00:00Z",
        deletedBy: null,
        deletedOn: null,
        lastPublishedBy: null,
        modifiedOn: null,
        restoredBy: null,
        restoredOn: null,
        revisionDeletedBy: null,
        revisionSavedBy: identity,
        revisionSavedOn: "2022-09-01T12:00:00Z",
        revisionCreatedBy: identity,
        revisionModifiedBy: null,
        revisionModifiedOn: null,
        revisionDeletedOn: null,
        revisionFirstPublishedBy: null,
        revisionFirstPublishedOn: null,
        revisionLastPublishedBy: null,
        revisionLastPublishedOn: null,
        savedBy: identity,
        modifiedBy: identity,
        revisionRestoredBy: null,
        revisionRestoredOn: null,
        createdBy: identity,
        modelId: "test",
        tenant: "root",
        meta: {},
        locked: false,
        status: "draft",
        version: 1,
        values
    };
};
