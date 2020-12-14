import { locales } from "@webiny/api-i18n/testing";

const mocks = {
    authorContentModel: ({ contentModelGroupId }) => ({
        name: "Author",
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
                _id: "id-favorite-book",
                fieldId: "favoriteBook",
                type: "ref",
                settings: {
                    modelId: "book"
                },
                label: {
                    values: [
                        {
                            locale: locales.en.id,
                            value: "Favorite Book"
                        },
                        {
                            locale: locales.de.id,
                            value: "Lieblingsbuch"
                        }
                    ]
                }
            },
            {
                _id: "id-simple",
                fieldId: "simple",
                type: "datetime",
                multipleValues: false,
                settings: {
                    type: "date"
                },
                label: {
                    values: [
                        {
                            locale: locales.en.id,
                            value: "The other day"
                        },
                        {
                            locale: locales.de.id,
                            value: "The other day"
                        }
                    ]
                }
            }
        ]
    }),
    bookContentModel: ({ contentModelGroupId }) => ({
        name: "Book",
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
            }
        ]
    }),
    removeFavoriteBookField: ({ contentModelId }) => ({
        id: contentModelId,
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
                    _id: "id-simple",
                    fieldId: "simple",
                    type: "datetime",
                    multipleValues: false,
                    settings: {
                        type: "time"
                    },
                    label: {
                        values: [
                            {
                                locale: locales.en.id,
                                value: "The other day"
                            },
                            {
                                locale: locales.de.id,
                                value: "The other day"
                            }
                        ]
                    }
                }
            ]
        }
    }),
    updateFavoriteBookFieldType: ({ contentModelId }) => ({
        id: contentModelId,
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
                    _id: "id-favorite-book",
                    fieldId: "favoriteBook",
                    type: "text",
                    settings: {
                        modelId: "book"
                    },
                    label: {
                        values: [
                            {
                                locale: locales.en.id,
                                value: "Favorite Book"
                            },
                            {
                                locale: locales.de.id,
                                value: "Lieblingsbuch"
                            }
                        ]
                    }
                },
                {
                    _id: "id-simple",
                    fieldId: "simple",
                    type: "datetime",
                    multipleValues: false,
                    settings: {
                        type: "time"
                    },
                    label: {
                        values: [
                            {
                                locale: locales.en.id,
                                value: "The other day"
                            },
                            {
                                locale: locales.de.id,
                                value: "The other day"
                            }
                        ]
                    }
                }
            ]
        }
    }),
    updateDateTimeFieldType: ({ contentModelId }) => ({
        id: contentModelId,
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
                    _id: "id-favorite-book",
                    fieldId: "favoriteBook",
                    type: "ref",
                    settings: {
                        modelId: "book"
                    },
                    label: {
                        values: [
                            {
                                locale: locales.en.id,
                                value: "Favorite Book"
                            },
                            {
                                locale: locales.de.id,
                                value: "Lieblingsbuch"
                            }
                        ]
                    }
                },
                {
                    _id: "id-simple",
                    fieldId: "simple",
                    type: "datetime",
                    multipleValues: false,
                    settings: {
                        type: "time"
                    },
                    label: {
                        values: [
                            {
                                locale: locales.en.id,
                                value: "The other day"
                            },
                            {
                                locale: locales.de.id,
                                value: "The other day"
                            }
                        ]
                    }
                }
            ]
        }
    }),
    updateRefFieldModelId: ({ contentModelId }) => ({
        id: contentModelId,
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
                    _id: "id-favorite-book",
                    fieldId: "favoriteBook",
                    type: "ref",
                    settings: {
                        modelId: "author"
                    },
                    label: {
                        values: [
                            {
                                locale: locales.en.id,
                                value: "Favorite Book"
                            },
                            {
                                locale: locales.de.id,
                                value: "Lieblingsbuch"
                            }
                        ]
                    }
                },
                {
                    _id: "id-simple",
                    fieldId: "simple",
                    type: "datetime",
                    multipleValues: false,
                    settings: {
                        type: "date"
                    },
                    label: {
                        values: [
                            {
                                locale: locales.en.id,
                                value: "The other day"
                            },
                            {
                                locale: locales.de.id,
                                value: "The other day"
                            }
                        ]
                    }
                }
            ]
        }
    }),

    book1: {
        data: {
            title: {
                values: [
                    {
                        locale: locales.en.id,
                        value: "Book1-en"
                    },
                    {
                        locale: locales.de.id,
                        value: "Book1-de"
                    }
                ]
            }
        }
    },
    author1: ({ book1Id }) => ({
        data: {
            title: {
                values: [
                    {
                        locale: locales.en.id,
                        value: "Author1-en"
                    },
                    {
                        locale: locales.de.id,
                        value: "Author2-de"
                    }
                ]
            },
            favoriteBook: {
                values: [
                    {
                        locale: locales.en.id,
                        value: book1Id
                    },
                    {
                        locale: locales.de.id,
                        value: book1Id
                    }
                ]
            },
            simple: {
                values: [
                    {
                        locale: locales.en.id,
                        value: "2020-06-26"
                    },
                    {
                        locale: locales.de.id,
                        value: "2020-06-26"
                    }
                ]
            }
        }
    })
};

export default mocks;
