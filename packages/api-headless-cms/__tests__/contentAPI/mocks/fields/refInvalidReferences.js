import { locales } from "@webiny/api-i18n/testing";

const mocks = {
    bookContentModel: ({ contentModelGroupId }) => ({
        data: {
            name: "Book",
            group: contentModelGroupId,
            fields: []
        }
    }),
    authorContentModel: ({ contentModelGroupId }) => ({
        data: {
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
        }
    }),
    authorWithoutBookRefFields: ({ contentModelGroupId }) => ({
        data: {
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
                }
            ]
        }
    }),
    modelA: ({ contentModelGroupId }) => ({
        data: {
            name: "A",
            group: contentModelGroupId,
            fields: []
        }
    }),
    modelBCreate: ({ contentModelGroupId }) => ({
        data: {
            name: "B",
            group: contentModelGroupId,
            fields: []
        }
    }),
    modelBUpdate: ({ modelId }) => ({
        id: modelId,
        data: {
            fields: [
                {
                    _id: "id-model-a-ref",
                    fieldId: "a",
                    type: "ref",
                    settings: {
                        modelId: "a"
                    },
                    label: {
                        values: [
                            {
                                locale: locales.en.id,
                                value: "A"
                            }
                        ]
                    }
                }
            ]
        }
    }),
    modelAUpdate: ({ modelId }) => ({
        id: modelId,
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
                }
            ]
        }
    })
};

export default mocks;
