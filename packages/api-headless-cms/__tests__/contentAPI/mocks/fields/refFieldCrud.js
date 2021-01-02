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
    book4: {
        data: {
            title: {
                values: [
                    {
                        locale: locales.en.id,
                        value: "Book4-en"
                    },
                    {
                        locale: locales.de.id,
                        value: "Book4-de"
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
                        value: [book1Id, book2Id]
                    },
                    {
                        locale: locales.de.id,
                        value: [book1Id, book2Id]
                    }
                ]
            }
        }
    }),
    createdAuthor1: ({ book1Id, book2Id }) => ({
        values: [
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
            }
        ]
    }),
    updateAuthor1: ({ authorId, book1Id, book2Id, book3Id, book4Id }) => ({
        id: authorId,
        data: {
            books: {
                values: [
                    {
                        locale: locales.en.id,
                        value: [book1Id, book2Id, book3Id]
                    },
                    {
                        locale: locales.de.id,
                        value: [book4Id]
                    },
                    {
                        locale: locales.it.id,
                        value: [book3Id]
                    }
                ]
            }
        }
    }),
    createdAuthor1Entries2Entries: ({ authorId, book1Id, book2Id, environmentId }) => [
        {
            deleted: false,
            entry1: authorId,
            entry1FieldId: "books",
            entry2: book1Id,
            entry1ModelId: "CmsAuthor",
            entry2ModelId: "CmsBook",
            environment: environmentId,
            locale: locales.en.id
        },
        {
            deleted: false,
            entry1: authorId,
            entry1FieldId: "books",
            entry2: book2Id,
            entry1ModelId: "CmsAuthor",
            entry2ModelId: "CmsBook",
            environment: environmentId,
            locale: locales.en.id
        },

        {
            deleted: false,
            entry1: authorId,
            entry1FieldId: "books",
            entry2: book1Id,
            entry1ModelId: "CmsAuthor",
            entry2ModelId: "CmsBook",
            environment: environmentId,
            locale: locales.de.id
        },
        {
            deleted: false,
            entry1: authorId,
            entry1FieldId: "books",
            entry2: book2Id,
            entry1ModelId: "CmsAuthor",
            entry2ModelId: "CmsBook",
            environment: environmentId,
            locale: locales.de.id
        }
    ],
    updatedAuthor1Entries2Entries: ({
        authorId,
        book1Id,
        book2Id,
        book3Id,
        book4Id,
        environmentId
    }) => [
        {
            deleted: false,
            entry1: authorId,
            entry1FieldId: "books",
            entry2: book1Id,
            entry1ModelId: "CmsAuthor",
            entry2ModelId: "CmsBook",
            environment: environmentId,
            locale: locales.en.id
        },
        {
            deleted: false,
            entry1: authorId,
            entry1FieldId: "books",
            entry2: book2Id,
            entry1ModelId: "CmsAuthor",
            entry2ModelId: "CmsBook",
            environment: environmentId,
            locale: locales.en.id
        },

        {
            deleted: true,
            entry1: authorId,
            entry1FieldId: "books",
            entry2: book1Id,
            entry1ModelId: "CmsAuthor",
            entry2ModelId: "CmsBook",
            environment: environmentId,
            locale: locales.de.id
        },
        {
            deleted: true,
            entry1: authorId,
            entry1FieldId: "books",
            entry2: book2Id,
            entry1ModelId: "CmsAuthor",
            entry2ModelId: "CmsBook",
            environment: environmentId,
            locale: locales.de.id
        },
        {
            deleted: false,
            entry1: authorId,
            entry1FieldId: "books",
            entry2: book3Id,
            entry1ModelId: "CmsAuthor",
            entry2ModelId: "CmsBook",
            environment: environmentId,
            locale: locales.en.id
        },
        {
            deleted: false,
            entry1: authorId,
            entry1FieldId: "books",
            entry2: book4Id,
            entry1ModelId: "CmsAuthor",
            entry2ModelId: "CmsBook",
            environment: environmentId,
            locale: locales.de.id
        },
        {
            deleted: false,
            entry1: authorId,
            entry1FieldId: "books",
            entry2: book3Id,
            entry1ModelId: "CmsAuthor",
            entry2ModelId: "CmsBook",
            environment: environmentId,
            locale: locales.it.id
        }
    ],
    author2: ({ book1Id, book2Id, book3Id, book4Id }) => ({
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
                    },
                    {
                        locale: locales.it.id,
                        value: [book3Id, book4Id]
                    }
                ]
            }
        }
    }),
    createdAuthor2: ({ book1Id, book2Id, book3Id, book4Id }) => ({
        values: [
            {
                value: [
                    {
                        id: book1Id,
                        meta: {
                            title: {
                                value: "Book1-en"
                            }
                        }
                    }
                ],
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
                    }
                ],
                locale: locales.de.id
            },
            {
                value: [
                    {
                        id: book4Id,
                        meta: {
                            title: {
                                value: "Book4-en"
                            }
                        }
                    },
                    {
                        id: book3Id,
                        meta: {
                            title: {
                                value: "Book3-en"
                            }
                        }
                    }
                ],
                locale: locales.it.id
            }
        ]
    }),
    createdAuthor2Entries2Entries: ({
        author2Id,
        author1Id,
        book1Id,
        book2Id,
        book3Id,
        book4Id,
        environmentId
    }) => [
        ...mocks.updatedAuthor1Entries2Entries({
            authorId: author1Id,
            book1Id,
            book2Id,
            book3Id,
            book4Id,
            environmentId
        }),
        {
            deleted: false,
            entry1: author2Id,
            entry1FieldId: "books",
            entry2: book1Id,
            entry1ModelId: "CmsAuthor",
            entry2ModelId: "CmsBook",
            environment: environmentId,
            locale: locales.en.id
        },
        {
            deleted: false,
            entry1: author2Id,
            entry1FieldId: "books",
            entry2: book2Id,
            entry1ModelId: "CmsAuthor",
            entry2ModelId: "CmsBook",
            environment: environmentId,
            locale: locales.de.id
        },
        {
            deleted: false,
            entry1: author2Id,
            entry1FieldId: "books",
            entry2: book3Id,
            entry1ModelId: "CmsAuthor",
            entry2ModelId: "CmsBook",
            environment: environmentId,
            locale: locales.it.id
        },
        {
            deleted: false,
            entry1: author2Id,
            entry1FieldId: "books",
            entry2: book4Id,
            entry1ModelId: "CmsAuthor",
            entry2ModelId: "CmsBook",
            environment: environmentId,
            locale: locales.it.id
        }
    ],
    updateAuthor2: ({ authorId, book1Id, book2Id, book3Id }) => ({
        id: authorId,
        data: {
            books: {
                values: [
                    {
                        locale: locales.en.id,
                        value: [book3Id]
                    },
                    {
                        locale: locales.de.id,
                        value: [book1Id]
                    },
                    {
                        locale: locales.it.id,
                        value: [book2Id]
                    }
                ]
            }
        }
    }),
    updatedAuthor2Entries2Entries: ({
        author1Id,
        author2Id,
        book1Id,
        book2Id,
        book3Id,
        book4Id,
        environmentId
    }) => [
        ...mocks.updatedAuthor1Entries2Entries({
            authorId: author1Id,
            book1Id,
            book2Id,
            book3Id,
            book4Id,
            environmentId
        }),
        {
            deleted: true,
            entry1: author2Id,
            entry1FieldId: "books",
            entry2: book1Id,
            entry1ModelId: "CmsAuthor",
            entry2ModelId: "CmsBook",
            environment: environmentId,
            locale: locales.en.id
        },
        {
            deleted: true,
            entry1: author2Id,
            entry1FieldId: "books",
            entry2: book2Id,
            entry1ModelId: "CmsAuthor",
            entry2ModelId: "CmsBook",
            environment: environmentId,
            locale: locales.de.id
        },
        {
            deleted: true,
            entry1: author2Id,
            entry1FieldId: "books",
            entry2: book3Id,
            entry1ModelId: "CmsAuthor",
            entry2ModelId: "CmsBook",
            environment: environmentId,
            locale: locales.it.id
        },
        {
            deleted: true,
            entry1: author2Id,
            entry1FieldId: "books",
            entry2: book4Id,
            entry1ModelId: "CmsAuthor",
            entry2ModelId: "CmsBook",
            environment: environmentId,
            locale: locales.it.id
        },
        {
            deleted: false,
            entry1: author2Id,
            entry1FieldId: "books",
            entry2: book3Id,
            entry1ModelId: "CmsAuthor",
            entry2ModelId: "CmsBook",
            environment: environmentId,
            locale: locales.en.id
        },
        {
            deleted: false,
            entry1: author2Id,
            entry1FieldId: "books",
            entry2: book1Id,
            entry1ModelId: "CmsAuthor",
            entry2ModelId: "CmsBook",
            environment: environmentId,
            locale: locales.de.id
        },
        {
            deleted: false,
            entry1: author2Id,
            entry1FieldId: "books",
            entry2: book2Id,
            entry1ModelId: "CmsAuthor",
            entry2ModelId: "CmsBook",
            environment: environmentId,
            locale: locales.it.id
        }
    ],

    // Removals.
    updateAuthorRemoveBooks: ({ authorId }) => ({
        id: authorId,
        data: {
            books: {
                values: [
                    {
                        locale: locales.en.id,
                        value: []
                    },
                    {
                        locale: locales.de.id,
                        value: []
                    },
                    {
                        locale: locales.it.id,
                        value: []
                    }
                ]
            }
        }
    }),
    updatedAuthorsRemovedBooksEntries2Entries: ({
        author1Id,
        author2Id,
        book1Id,
        book2Id,
        book3Id,
        book4Id,
        environmentId
    }) => [
        {
            deleted: true,
            entry1: author1Id,
            entry1FieldId: "books",
            entry2: book1Id,
            entry1ModelId: "CmsAuthor",
            entry2ModelId: "CmsBook",
            environment: environmentId,
            locale: locales.en.id
        },
        {
            deleted: true,
            entry1: author1Id,
            entry1FieldId: "books",
            entry2: book2Id,
            entry1ModelId: "CmsAuthor",
            entry2ModelId: "CmsBook",
            environment: environmentId,
            locale: locales.en.id
        },

        {
            deleted: true,
            entry1: author1Id,
            entry1FieldId: "books",
            entry2: book1Id,
            entry1ModelId: "CmsAuthor",
            entry2ModelId: "CmsBook",
            environment: environmentId,
            locale: locales.de.id
        },
        {
            deleted: true,
            entry1: author1Id,
            entry1FieldId: "books",
            entry2: book2Id,
            entry1ModelId: "CmsAuthor",
            entry2ModelId: "CmsBook",
            environment: environmentId,
            locale: locales.de.id
        },
        {
            deleted: true,
            entry1: author1Id,
            entry1FieldId: "books",
            entry2: book3Id,
            entry1ModelId: "CmsAuthor",
            entry2ModelId: "CmsBook",
            environment: environmentId,
            locale: locales.en.id
        },
        {
            deleted: true,
            entry1: author1Id,
            entry1FieldId: "books",
            entry2: book4Id,
            entry1ModelId: "CmsAuthor",
            entry2ModelId: "CmsBook",
            environment: environmentId,
            locale: locales.de.id
        },
        {
            deleted: true,
            entry1: author1Id,
            entry1FieldId: "books",
            entry2: book3Id,
            entry1ModelId: "CmsAuthor",
            entry2ModelId: "CmsBook",
            environment: environmentId,
            locale: locales.it.id
        },
        {
            deleted: true,
            entry1: author2Id,
            entry1FieldId: "books",
            entry2: book1Id,
            entry1ModelId: "CmsAuthor",
            entry2ModelId: "CmsBook",
            environment: environmentId,
            locale: locales.en.id
        },
        {
            deleted: true,
            entry1: author2Id,
            entry1FieldId: "books",
            entry2: book2Id,
            entry1ModelId: "CmsAuthor",
            entry2ModelId: "CmsBook",
            environment: environmentId,
            locale: locales.de.id
        },
        {
            deleted: true,
            entry1: author2Id,
            entry1FieldId: "books",
            entry2: book3Id,
            entry1ModelId: "CmsAuthor",
            entry2ModelId: "CmsBook",
            environment: environmentId,
            locale: locales.it.id
        },
        {
            deleted: true,
            entry1: author2Id,
            entry1FieldId: "books",
            entry2: book4Id,
            entry1ModelId: "CmsAuthor",
            entry2ModelId: "CmsBook",
            environment: environmentId,
            locale: locales.it.id
        },
        {
            deleted: true,
            entry1: author2Id,
            entry1FieldId: "books",
            entry2: book3Id,
            entry1ModelId: "CmsAuthor",
            entry2ModelId: "CmsBook",
            environment: environmentId,
            locale: locales.en.id
        },
        {
            deleted: true,
            entry1: author2Id,
            entry1FieldId: "books",
            entry2: book1Id,
            entry1ModelId: "CmsAuthor",
            entry2ModelId: "CmsBook",
            environment: environmentId,
            locale: locales.de.id
        },
        {
            deleted: true,
            entry1: author2Id,
            entry1FieldId: "books",
            entry2: book2Id,
            entry1ModelId: "CmsAuthor",
            entry2ModelId: "CmsBook",
            environment: environmentId,
            locale: locales.it.id
        }
    ]
};

export default mocks;
