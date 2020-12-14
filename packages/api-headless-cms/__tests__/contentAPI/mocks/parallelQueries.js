import { locales } from "./I18NLocales";

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
                    fieldId: "tags",
                    type: "text",
                    multipleValues: true,
                    label: {
                        values: [
                            {
                                locale: locales.en.id,
                                value: "Tags-en"
                            },
                            {
                                locale: locales.de.id,
                                value: "Tags-de"
                            }
                        ]
                    }
                }
            ]
        }
    }),
    product1: {
        data: {
            title: {
                values: [
                    {
                        locale: locales.en.id,
                        value: "Product En 1"
                    },
                    {
                        locale: locales.de.id,
                        value: "Produkt De 1"
                    }
                ]
            },
            tags: {
                values: [
                    {
                        locale: locales.en.id,
                        value: ["product", "1"]
                    },
                    {
                        locale: locales.de.id,
                        value: ["produkt", "1"]
                    }
                ]
            }
        }
    },
    product2: {
        data: {
            title: {
                values: [
                    {
                        locale: locales.en.id,
                        value: "Product En 2"
                    },
                    {
                        locale: locales.de.id,
                        value: "Produkt De 2"
                    }
                ]
            },
            tags: {
                values: [
                    {
                        locale: locales.en.id,
                        value: ["product", "2"]
                    },
                    {
                        locale: locales.de.id,
                        value: ["produkt", "2"]
                    }
                ]
            }
        }
    },
    product3: {
        data: {
            title: {
                values: [
                    {
                        locale: locales.en.id,
                        value: "Product En 3"
                    },
                    {
                        locale: locales.de.id,
                        value: "Produkt De 3"
                    }
                ]
            },
            tags: {
                values: [
                    {
                        locale: locales.en.id,
                        value: ["product", "3"]
                    },
                    {
                        locale: locales.de.id,
                        value: ["produkt", "3"]
                    }
                ]
            }
        }
    }
};
