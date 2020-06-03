import { locales } from "@webiny/api-i18n/testing";

const mocks = {
    authorContentModel: ({ contentModelGroupId }) => ({
        data: {
            name: "Author",
            group: contentModelGroupId,
            fields: []
        }
    }),
    updatedAuthorContentModel: ({ authorContentModelId, contentModelGroupId }) => ({
        id: authorContentModelId,
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
                    _id: "vqk-UApa0",
                    fieldId: "age",
                    type: "number",
                    label: {
                        values: [
                            {
                                locale: locales.en.id,
                                value: "Number"
                            },
                            {
                                locale: locales.de.id,
                                value: "Numer"
                            }
                        ]
                    }
                }
            ]
        }
    }),
    removeFieldUpdateAuthorContentModel: ({ authorContentModelId, contentModelGroupId }) => ({
        id: authorContentModelId,
        data: {
            name: "Author",
            group: contentModelGroupId,
            fields: [
                {
                    _id: "vqk-UApa0",
                    fieldId: "age",
                    type: "number",
                    label: {
                        values: [
                            {
                                locale: locales.en.id,
                                value: "Number"
                            },
                            {
                                locale: locales.de.id,
                                value: "Numer"
                            }
                        ]
                    }
                }
            ]
        }
    })
};

export default mocks;
