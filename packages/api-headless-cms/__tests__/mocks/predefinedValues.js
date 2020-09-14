import { locales } from "./../mocks/I18NLocales";

export default {
    contentModel: ({ contentModelGroupId }) => ({
        data: {
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
                    _id: "id-text",
                    fieldId: "text",
                    type: "text",
                    predefinedValues: {
                        enabled: true,
                        values: {
                            values: [
                                {
                                    locale: locales.en.id,
                                    value: [
                                        {
                                            label: "en-1",
                                            value: "en1"
                                        },
                                        {
                                            label: "en-2",
                                            value: "en2"
                                        },
                                        {
                                            label: "en-3",
                                            value: "en3"
                                        }
                                    ]
                                },
                                {
                                    locale: locales.de.id,
                                    value: [
                                        {
                                            label: "de-1",
                                            value: "de1"
                                        },
                                        {
                                            label: "de-2",
                                            value: "de2"
                                        },
                                        {
                                            label: "de-3",
                                            value: "de3"
                                        }
                                    ]
                                }
                            ]
                        }
                    },
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
    createdContentModelFields: [
        {
            _id: "vqk-UApa0",
            fieldId: "title",
            type: "text",
            label: {
                values: [
                    {
                        value: "Title",
                        locale: "eeeeeeeeeeeeeeeeeeeeeeee"
                    },
                    {
                        value: "Titel",
                        locale: "dddddddddddddddddddddddd"
                    }
                ]
            },
            placeholderText: {
                values: []
            },
            helpText: {
                values: []
            },
            predefinedValues: {
                enabled: null,
                values: {
                    values: []
                }
            },
            multipleValues: false,
            renderer: null,
            validation: [],
            settings: {}
        },
        {
            _id: "id-text",
            fieldId: "text",
            type: "text",
            label: {
                values: [
                    {
                        value: "Text-en",
                        locale: "eeeeeeeeeeeeeeeeeeeeeeee"
                    },
                    {
                        value: "Text-de",
                        locale: "dddddddddddddddddddddddd"
                    }
                ]
            },
            placeholderText: {
                values: []
            },
            helpText: {
                values: []
            },
            predefinedValues: {
                enabled: true,
                values: {
                    values: [
                        {
                            locale: "eeeeeeeeeeeeeeeeeeeeeeee",
                            value: [
                                {
                                    label: "en-1",
                                    value: "en1"
                                },
                                {
                                    label: "en-2",
                                    value: "en2"
                                },
                                {
                                    label: "en-3",
                                    value: "en3"
                                }
                            ]
                        },
                        {
                            locale: "dddddddddddddddddddddddd",
                            value: [
                                {
                                    label: "de-1",
                                    value: "de1"
                                },
                                {
                                    label: "de-2",
                                    value: "de2"
                                },
                                {
                                    label: "de-3",
                                    value: "de3"
                                }
                            ]
                        }
                    ]
                }
            },
            multipleValues: false,
            renderer: null,
            validation: [],
            settings: {}
        }
    ],
    createProductValidValues: {
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
            text: {
                values: [
                    {
                        locale: locales.en.id,
                        value: "en1"
                    },
                    {
                        locale: locales.de.id,
                        value: "de2"
                    }
                ]
            }
        }
    },
    createProductWithValidValues: product => ({
        id: product.id,
        savedOn: product.savedOn,
        title: {
            values: [
                {
                    value: "Test Pen",
                    locale: "eeeeeeeeeeeeeeeeeeeeeeee"
                },
                {
                    value: "Test Kugelschreiber",
                    locale: "dddddddddddddddddddddddd"
                }
            ]
        },
        text: {
            values: [
                {
                    value: "en1",
                    locale: "eeeeeeeeeeeeeeeeeeeeeeee"
                },
                {
                    value: "de2",
                    locale: "dddddddddddddddddddddddd"
                }
            ]
        }
    })
};
