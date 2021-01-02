import { locales } from "./../mocks/I18NLocales";

export default {
    failModel1: ({ contentModelGroupId }) => ({
        data: {
            name: "123-Book",
            group: contentModelGroupId,
            fields: [
                {
                    _id: "vqk-UApa0-1",
                    fieldId: "123-title",
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
                    fieldId: "123-age",
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
    }),
    failModel2: ({ contentModelGroupId }) => ({
        data: {
            name: "Book",
            group: contentModelGroupId,
            fields: [
                {
                    _id: "vqk-UApa0-1",
                    fieldId: "123-title",
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
                    fieldId: "123-age",
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
    }),
    failModel3: ({ contentModelGroupId }) => ({
        data: {
            name: "Book",
            group: contentModelGroupId,
            fields: [
                {
                    _id: "vqk-UApa0-1",
                    fieldId: "123-title",
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
            ]
        }
    }),
    failModel4: ({ contentModelGroupId }) => ({
        data: {
            name: "Book",
            group: contentModelGroupId,
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
            ]
        }
    }),
    failModel5: ({ contentModelId }) => ({
        id: contentModelId,
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
                },
                {
                    _id: "vqk-UApa0-2",
                    fieldId: "123-something",
                    type: "number",
                    label: {
                        values: [
                            {
                                locale: locales.en.id,
                                value: "Something"
                            },
                            {
                                locale: locales.de.id,
                                value: "Smt"
                            }
                        ]
                    }
                }
            ]
        }
    })
};
