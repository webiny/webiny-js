import { locales } from "@webiny/api-i18n/testing";

const mocks = {
    bookContentModel: ({ contentModelGroupId }) => ({
        name: "Book",
        group: contentModelGroupId,
        fields: []
    }),
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
    authorWithoutBookRefFields: ({ contentModelGroupId }) => ({
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
    })
};

export default mocks;
