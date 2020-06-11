import { locales } from "./../mocks/I18NLocales";

const fields = [
    {
        _id: "vqk-UApa0-1",
        fieldId: "name",
        type: "text",
        label: {
            values: [
                {
                    locale: locales.en.id,
                    value: "Name"
                },
                {
                    locale: locales.de.id,
                    value: "Name"
                }
            ]
        }
    },
    {
        _id: "vqk-UApa0-1",
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
        _id: "vqk-UApa0-2",
        fieldId: "age",
        type: "number",
        label: {
            values: [
                {
                    locale: locales.en.id,
                    value: "Age"
                },
                {
                    locale: locales.de.id,
                    value: "Jahre"
                }
            ]
        }
    }
];

export default {
    fields,
    book: ({ contentModelGroupId }) => ({
        data: {
            name: "Book",
            group: contentModelGroupId,
            fields
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
            },
            age: {
                values: [
                    {
                        locale: locales.en.id,
                        value: 1
                    },
                    {
                        locale: locales.de.id,
                        value: 1
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
            },
            age: {
                values: [
                    {
                        locale: locales.en.id,
                        value: 2
                    },
                    {
                        locale: locales.de.id,
                        value: 2
                    }
                ]
            }
        }
    },

    updateBook1: ({ contentModelGroupId }) => ({
        data: {
            fields: [
                {
                    _id: "vqk-UApa0-1",
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
                    _id: "vqk-UApa0-2",
                    fieldId: "jahre",
                    type: "number",
                    label: {
                        values: [
                            {
                                locale: locales.en.id,
                                value: "Age"
                            },
                            {
                                locale: locales.de.id,
                                value: "Jahre"
                            }
                        ]
                    }
                }
            ]
        }
    })
};
