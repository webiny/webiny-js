import { locales } from "./../mocks/I18NLocales";

export default {
    contentModel: ({ contentModelGroupId }) => ({
        name: "Product",
        group: contentModelGroupId,
        fields: [
            {
                _id: "vqk-UApa0",
                fieldId: "title",
                type: "text",
                label: {
                    values: [
                        {
                            locale: locales.en.id,
                            value: "Title"
                        },
                        {
                            locale: locales.de.id,
                            value: "Titel"
                        }
                    ]
                }
            },
            {
                _id: "id-boolean",
                fieldId: "boolean",
                type: "boolean",
                multipleValues: true,
                label: {
                    values: [
                        {
                            locale: locales.en.id,
                            value: "Texts-en"
                        },
                        {
                            locale: locales.de.id,
                            value: "Texts-de"
                        }
                    ]
                }
            },
            {
                _id: "id-date",
                fieldId: "date",
                type: "datetime",
                multipleValues: true,
                settings: {
                    type: "date"
                },
                label: {
                    values: [
                        {
                            locale: locales.en.id,
                            value: "Date-en"
                        },
                        {
                            locale: locales.de.id,
                            value: "Date-de"
                        }
                    ]
                }
            },
            {
                _id: "id-long-text",
                fieldId: "longText",
                type: "long-text",
                multipleValues: true,
                label: {
                    values: [
                        {
                            locale: locales.en.id,
                            value: "LongText-en"
                        },
                        {
                            locale: locales.de.id,
                            value: "LongText-de"
                        }
                    ]
                }
            },
            {
                _id: "id-number",
                fieldId: "number",
                type: "number",
                multipleValues: true,
                label: {
                    values: [
                        {
                            locale: locales.en.id,
                            value: "Number-en"
                        },
                        {
                            locale: locales.de.id,
                            value: "Number-de"
                        }
                    ]
                }
            },
            {
                _id: "id-rich-text",
                fieldId: "richText",
                type: "rich-text",
                multipleValues: true,
                label: {
                    values: [
                        {
                            locale: locales.en.id,
                            value: "RichText-en"
                        },
                        {
                            locale: locales.de.id,
                            value: "RichText-de"
                        }
                    ]
                }
            },
            {
                _id: "id-text",
                fieldId: "text",
                type: "text",
                multipleValues: true,
                label: {
                    values: [
                        {
                            locale: locales.en.id,
                            value: "Text-en"
                        },
                        {
                            locale: locales.de.id,
                            value: "Text-de"
                        }
                    ]
                }
            }
        ]
    }),
    createProduct: {
        title: {
            values: [
                {
                    locale: locales.en.id,
                    value: "Test Pen"
                },
                {
                    locale: locales.de.id,
                    value: "Test Kugelschreiber"
                }
            ]
        },
        boolean: {
            values: [
                {
                    locale: locales.en.id,
                    value: [true, true, true, false]
                },
                {
                    locale: locales.de.id,
                    value: [false, false, false, true, true]
                }
            ]
        },
        date: {
            values: [
                {
                    locale: locales.en.id,
                    value: ["2014-01-01"]
                },
                {
                    locale: locales.de.id,
                    value: ["2020-01-01", "2020-01-10"]
                }
            ]
        },
        longText: {
            values: [
                {
                    locale: locales.en.id,
                    value: ["Long text 1", "Long text 2"]
                },
                {
                    locale: locales.de.id,
                    value: ["Long text 3", "Long text 4", "Long text 5"]
                }
            ]
        },
        number: {
            values: [
                {
                    locale: locales.en.id,
                    value: [1, 2, 3, 4]
                },
                {
                    locale: locales.de.id,
                    value: [5, 6, 7, 8, 9, 10]
                }
            ]
        },
        richText: {
            values: [
                {
                    locale: locales.en.id,
                    value: [{ something: 1 }, { something: 2 }]
                },
                {
                    locale: locales.de.id,
                    value: [{ something: 3 }, { something: 4 }, { xyz: 5 }]
                }
            ]
        },
        text: {
            values: [
                {
                    locale: locales.en.id,
                    value: ["Pen", "Pencil", "Eraser", "Sharpener"]
                },
                {
                    locale: locales.de.id,
                    value: ["Kugelschreiber", "Bleistift"]
                }
            ]
        }
    },
    createdProduct: product => ({
        id: product.id,
        savedOn: product.savedOn,
        title: {
            values: [
                {
                    value: "Test Pen",
                    locale: locales.en.id
                },
                {
                    value: "Test Kugelschreiber",
                    locale: locales.de.id
                }
            ]
        },
        boolean: {
            values: [
                {
                    value: [true, true, true, false],
                    locale: locales.en.id
                },
                {
                    value: [false, false, false, true, true],
                    locale: locales.de.id
                }
            ]
        },
        date: {
            values: [
                {
                    value: ["2014-01-01"],
                    locale: locales.en.id
                },
                {
                    value: ["2020-01-01", "2020-01-10"],
                    locale: locales.de.id
                }
            ]
        },
        longText: {
            values: [
                {
                    value: ["Long text 1", "Long text 2"],
                    locale: locales.en.id
                },
                {
                    value: ["Long text 3", "Long text 4", "Long text 5"],
                    locale: locales.de.id
                }
            ]
        },
        number: {
            values: [
                {
                    value: [1, 2, 3, 4],
                    locale: locales.en.id
                },
                {
                    value: [5, 6, 7, 8, 9, 10],
                    locale: locales.de.id
                }
            ]
        },
        richText: {
            values: [
                {
                    value: [
                        {
                            something: 1
                        },
                        {
                            something: 2
                        }
                    ],
                    locale: locales.en.id
                },
                {
                    value: [
                        {
                            something: 3
                        },
                        {
                            something: 4
                        },
                        {
                            xyz: 5
                        }
                    ],
                    locale: locales.de.id
                }
            ]
        },
        text: {
            values: [
                {
                    value: ["Pen", "Pencil", "Eraser", "Sharpener"],
                    locale: locales.en.id
                },
                {
                    value: ["Kugelschreiber", "Bleistift"],
                    locale: locales.de.id
                }
            ]
        }
    }),
    cannotSetAsEntryTitle: ({ contentModelGroupId, titleFieldId = "" }) => ({
        data: {
            name: "Product",
            group: contentModelGroupId,
            titleFieldId,
            fields: [
                {
                    _id: "vqk-UApa0",
                    fieldId: "title",
                    type: "text",
                    label: {
                        values: [
                            {
                                locale: locales.en.id,
                                value: "Title"
                            },
                            {
                                locale: locales.de.id,
                                value: "Titel"
                            }
                        ]
                    }
                },
                {
                    _id: "id-text",
                    fieldId: "someMultipleValueTextField",
                    type: "text",
                    multipleValues: true,
                    label: {
                        values: [
                            {
                                locale: locales.en.id,
                                value: "Text-en"
                            },
                            {
                                locale: locales.de.id,
                                value: "Text-de"
                            }
                        ]
                    }
                }
            ]
        }
    }),
    createProductWithTagsAssigned: {
        data: {
            title: {
                values: [
                    {
                        value: "Test Pen",
                        locale: locales.en.id
                    },
                    {
                        value: "Test Kugelschreiber",
                        locale: locales.de.id
                    }
                ]
            },
            tags: {
                values: [
                    {
                        value: ["Pen", "Pencil", "Eraser", "Sharpener"],
                        locale: locales.en.id
                    },
                    {
                        value: ["Kugelschreiber", "Bleistift"],
                        locale: locales.de.id
                    }
                ]
            }
        }
    },
    blogWithTagsSetToMultipleValue: ({ contentModelGroupId }) => ({
        data: {
            name: "Blog",
            group: contentModelGroupId,
            fields: [
                {
                    _id: "vqk-UApa0",
                    fieldId: "title",
                    type: "text",
                    label: {
                        values: [
                            {
                                locale: locales.en.id,
                                value: "Title"
                            },
                            {
                                locale: locales.de.id,
                                value: "Titel"
                            }
                        ]
                    }
                },
                {
                    _id: "id-text",
                    fieldId: "tags",
                    type: "text",
                    multipleValues: true,
                    label: {
                        values: [
                            {
                                locale: locales.en.id,
                                value: "Tags"
                            },
                            {
                                locale: locales.de.id,
                                value: "Stichworte"
                            }
                        ]
                    }
                }
            ]
        }
    }),
    blogWithTagsSetToSingleValue: ({ productId }) => ({
        id: productId,
        data: {
            fields: [
                {
                    _id: "vqk-UApa0",
                    fieldId: "title",
                    type: "text",
                    label: {
                        values: [
                            {
                                locale: locales.en.id,
                                value: "Title"
                            },
                            {
                                locale: locales.de.id,
                                value: "Titel"
                            }
                        ]
                    }
                },
                {
                    _id: "id-text",
                    fieldId: "tags",
                    type: "text",
                    multipleValues: false,
                    label: {
                        values: [
                            {
                                locale: locales.en.id,
                                value: "Tags"
                            },
                            {
                                locale: locales.de.id,
                                value: "Stichworte"
                            }
                        ]
                    }
                }
            ]
        }
    })
};
