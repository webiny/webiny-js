import { locales } from "./I18NLocales";

const fields = [
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
                        value: 12
                    },
                    {
                        locale: locales.de.id,
                        value: 12
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
                        value: 22
                    },
                    {
                        locale: locales.de.id,
                        value: 22
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
            },
            age: {
                values: [
                    {
                        locale: locales.en.id,
                        value: 33
                    },
                    {
                        locale: locales.de.id,
                        value: 33
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
            },
            age: {
                values: [
                    {
                        locale: locales.en.id,
                        value: 44
                    },
                    {
                        locale: locales.de.id,
                        value: 44
                    }
                ]
            }
        }
    }
};
