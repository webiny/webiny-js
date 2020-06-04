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
                _id: "id-other-books",
                fieldId: "otherBooks",
                type: "ref",
                multipleValues: true,
                settings: {
                    modelId: "book"
                },
                label: {
                    values: [
                        {
                            locale: locales.en.id,
                            value: "Other Books"
                        },
                        {
                            locale: locales.de.id,
                            value: "Andere Bücher"
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
    book2: {
        data: {
            title: {
                values: [
                    {
                        locale: locales.en.id,
                        value: "Book2-en"
                    },
                    {
                        locale: locales.de.id,
                        value: "Book2-de"
                    }
                ]
            }
        }
    },
    book3: {
        data: {
            title: {
                values: [
                    {
                        locale: locales.en.id,
                        value: "Book3-en"
                    },
                    {
                        locale: locales.de.id,
                        value: "Book3-de"
                    }
                ]
            }
        }
    },
    author1: ({ book1Id, book2Id }) => ({
        data: {
            title: {
                values: [
                    {
                        locale: locales.en.id,
                        value: "Author1-en"
                    },
                    {
                        locale: locales.de.id,
                        value: "Author1-de"
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
                        value: book2Id
                    }
                ]
            },
            otherBooks: {
                values: [
                    {
                        locale: locales.en.id,
                        value: [book1Id, book2Id]
                    },
                    {
                        locale: locales.de.id,
                        value: []
                    }
                ]
            }
        }
    }),
    author2: ({ book1Id, book2Id, book3Id }) => ({
        data: {
            title: {
                values: [
                    {
                        locale: locales.en.id,
                        value: "Author2-en"
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
                        value: book2Id
                    },
                    {
                        locale: locales.de.id,
                        value: book1Id
                    }
                ]
            },
            otherBooks: {
                values: [
                    {
                        locale: locales.en.id,
                        value: [book2Id, book3Id, book2Id, book1Id, book3Id]
                    },
                    {
                        locale: locales.de.id,
                        value: [book3Id, book3Id, book1Id, book2Id, book1Id]
                    }
                ]
            }
        }
    }),
    readApiResults: ({ book1Id, book2Id, book3Id }) => [
        {
            title: "Author2-en",
            favoriteBook: {
                id: book2Id,
                title: "Book2-en"
            },
            otherBooks: [
                {
                    id: book2Id,
                    title: "Book2-en"
                },
                {
                    id: book3Id,
                    title: "Book3-en"
                },
                {
                    id: book3Id,
                    title: "Book3-en"
                },
                {
                    id: book1Id,
                    title: "Book1-en"
                },
                {
                    id: book2Id,
                    title: "Book2-en"
                }
            ]
        },
        {
            title: "Author1-en",
            favoriteBook: {
                id: book1Id,
                title: "Book1-en"
            },
            otherBooks: [
                {
                    id: book2Id,
                    title: "Book2-en"
                },
                {
                    id: book1Id,
                    title: "Book1-en"
                }
            ]
        }
    ]
};

export default mocks;
