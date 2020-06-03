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
                _id: "id-books",
                fieldId: "books",
                type: "ref",
                multipleValues: true,
                settings: {
                    modelId: "book"
                },
                label: {
                    values: [
                        {
                            locale: locales.en.id,
                            value: "Books"
                        },
                        {
                            locale: locales.de.id,
                            value: "Bücher"
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
                        value: "Author2-de"
                    }
                ]
            },
            books: {
                values: [
                    {
                        locale: locales.en.id,
                        value: [book1Id]
                    },
                    {
                        locale: locales.de.id,
                        value: [book2Id]
                    }
                ]
            }
        }
    }),
    author1Revision2: ({ authorId, book1Id, book2Id }) => ({
        revision: authorId,
        data: {
            books: {
                values: [
                    {
                        locale: locales.en.id,
                        value: []
                    },
                    {
                        locale: locales.de.id,
                        value: [book1Id, book2Id]
                    },
                    {
                        locale: locales.it.id,
                        value: [book2Id]
                    }
                ]
            }
        }
    }),
    newAuthorRevisionEntries2Entries: ({
        environmentId,
        authorRev1Id,
        authorRev2Id,
        book1Id,
        book2Id
    }) => [
        {
            locale: locales.en.id,
            deleted: false,
            entry1: authorRev1Id,
            entry2: book1Id,
            entry1ClassId: "CmsAuthor",
            entry2ClassId: "CmsBook",
            environment: environmentId
        },
        {
            locale: locales.de.id,
            deleted: false,
            entry1: authorRev1Id,
            entry2: book2Id,
            entry1ClassId: "CmsAuthor",
            entry2ClassId: "CmsBook",
            environment: environmentId
        },
        {
            locale: locales.de.id,
            deleted: false,
            entry1: authorRev2Id,
            entry2: book1Id,
            entry1ClassId: "CmsAuthor",
            entry2ClassId: "CmsBook",
            environment: environmentId
        },
        {
            locale: locales.de.id,
            deleted: false,
            entry1: authorRev2Id,
            entry2: book2Id,
            entry1ClassId: "CmsAuthor",
            entry2ClassId: "CmsBook",
            environment: environmentId
        },
        {
            locale: locales.it.id,
            deleted: false,
            entry1: authorRev2Id,
            entry2: book2Id,
            entry1ClassId: "CmsAuthor",
            entry2ClassId: "CmsBook",
            environment: environmentId
        }
    ],
    getAuthorViaGqlBooksField: ({ book1Id, book2Id }) => ({
        values: [
            {
                value: [],
                locale: locales.en.id
            },
            {
                value: [
                    {
                        id: book2Id,
                        meta: {
                            title: {
                                value: "Book2-en"
                            }
                        }
                    },
                    {
                        id: book1Id,
                        meta: {
                            title: {
                                value: "Book1-en"
                            }
                        }
                    }
                ],
                locale: locales.de.id
            },
            {
                value: [
                    {
                        id: book2Id,
                        meta: {
                            title: {
                                value: "Book2-en"
                            }
                        }
                    }
                ],
                locale: locales.it.id
            }
        ]
    })
};

export default mocks;
