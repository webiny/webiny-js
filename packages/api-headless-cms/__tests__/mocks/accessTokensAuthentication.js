import { locales } from "./../mocks/I18NLocales";

export default {
    productContentModel: ({ contentModelGroupId }) => ({
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
                }
            ]
        }
    })
};
