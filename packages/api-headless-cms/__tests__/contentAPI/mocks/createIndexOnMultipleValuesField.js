import { locales } from "./../mocks/I18NLocales";

export default {
    blogWithTagsSetToMultipleValue: ({ contentModelGroupId }) => ({
        data: {
            name: "Blog",
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
                                value: "Tags"
                            },
                            {
                                locale: locales.de.id,
                                value: "Stichworte"
                            }
                        ]
                    }
                }
            ]
        }
    })
};
