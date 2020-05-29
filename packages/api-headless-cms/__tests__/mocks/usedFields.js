import { locales } from "./../mocks/I18NLocales";

export default {
    withTitleFieldOnly: ({ contentModelGroupId }) => ({
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
    }),

    tryToRemoveTitleField: ({ contentModelId }) => ({
        id: contentModelId,
        data: { fields: [] }
    }),
    createProduct: {
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
        }
    },
    createProductWithoutValues: {
        data: {}
    }
};
