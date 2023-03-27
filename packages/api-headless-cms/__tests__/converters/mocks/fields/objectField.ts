import { createModelField } from "~tests/converters/mocks/utils";
import { createTextField } from "./textField";

export const createObjectField = () => {
    return createModelField({
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
                            }),
                            createModelField({
                                type: "object",
                                multipleValues: true,
                                fieldId: "objectInMyObjectOptions",
                                settings: {
                                    /**
                                     * TODO THIS!
                                     * myObject.myObjectOptions.objectInMyObjectOptions
                                     */
                                    fields: [
                                        createModelField({
                                            type: "text",
                                            multipleValues: true,
                                            fieldId: "textInObjectInMyObjectOptions"
                                        }),
                                        createModelField({
                                            type: "number",
                                            multipleValues: true,
                                            fieldId: "numberInObjectInMyObjectOptions"
                                        }),
                                        createModelField({
                                            type: "object",
                                            multipleValues: false,
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
    });
};

export const createObjectFieldUndefined = () => {
    return createModelField({
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
    });
};

export const createObjectFieldMultiple = () => {
    return createModelField({
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
    });
};

export const createObjectFieldWithDynamicZone = () => {
    return createModelField({
        fieldId: "objectWithDynamicZone",
        type: "object",
        settings: {
            fields: [
                createTextField(),
                createModelField({
                    type: "dynamicZone",
                    fieldId: "dynamicZoneObject",
                    multipleValues: false,
                    settings: {
                        templates: [
                            {
                                layout: [["title"]],
                                name: "Dynamic Zone Title",
                                gqlTypeName: "DynamicZoneTitleWithinObject",
                                icon: "fas/flag",
                                description: "",
                                id: "dynamicZoneTitleTemplate",
                                fields: [
                                    createModelField({
                                        fieldId: "title",
                                        type: "text"
                                    })
                                ]
                            }
                        ]
                    }
                })
            ]
        }
    });
};
