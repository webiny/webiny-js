import { locales } from "./I18NLocales";

export default {
    modelWithFieldIdSetToId: ({ contentModelGroupId }) => ({
        data: {
            name: "Book",
            group: contentModelGroupId,
            fields: [
                {
                    _id: "vqk-UApa0-1",
                    fieldId: "id",
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
    modelWithFieldIdSetToIdIncludingWhiteSpace: ({ contentModelGroupId }) => ({
        data: {
            name: "Book",
            group: contentModelGroupId,
            fields: [
                {
                    _id: "vqk-UApa0-1",
                    fieldId: "  iD ",
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
    modelWithFieldIdContainingWhiteSpace: ({ contentModelGroupId }) => ({
        data: {
            name: "Book",
            group: contentModelGroupId,
            fields: [
                {
                    _id: "vqk-UApa0-1",
                    fieldId: "    title   ",
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
    modelWithValidFieldIds: ({ contentModelGroupId }) => ({
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
                }
            ]
        }
    })
};
