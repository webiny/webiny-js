import { locales } from "./../mocks/I18NLocales";

export default {
    book: ({ contentModelGroupId }) => ({
        data: {
            name: "Book",
            group: contentModelGroupId,
            fields: [
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
                }
            ]
        }
    }),
    removeTitleField: ({ contentModelId, contentModelGroupId }) => ({
        id: contentModelId,
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
