import { locales } from "./../mocks/I18NLocales";

export default {
    contentModel: ({ contentModelGroupId }) => ({
        data: {
            name: "P",
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
                }
            ]
        }
    }),
    createP: {
        data: {
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
            }
        }
    },
    createdP: productId => [
        {
            id: productId,
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
            }
        }
    ]
};
