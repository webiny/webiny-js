import { locales } from "./../mocks/I18NLocales";

export default {
    contentModelOne: ({ contentModelGroupId }) => ({
        name: "ModelOne",
        group: contentModelGroupId,
        fields: [
            {
                _id: "model-one",
                fieldId: "text",
                type: "text",
                label: {
                    values: [
                        {
                            locale: locales.en.id,
                            value: "ModelOne-En"
                        },
                        {
                            locale: locales.de.id,
                            value: "ModelOne-De"
                        }
                    ]
                }
            }
        ]
    }),
    createModelOne: {
        data: {
            text: {
                values: [
                    {
                        locale: locales.en.id,
                        value: "Model One"
                    },
                    {
                        locale: locales.de.id,
                        value: "Model One"
                    }
                ]
            }
        }
    },
    contentModelTwo: ({ contentModelGroupId }) => ({
        name: "ModelTwo",
        group: contentModelGroupId,
        fields: [
            {
                _id: "model-two",
                fieldId: "text",
                type: "text",
                label: {
                    values: [
                        {
                            locale: locales.en.id,
                            value: "ModelTwo-En"
                        },
                        {
                            locale: locales.de.id,
                            value: "ModelTwo-De"
                        }
                    ]
                }
            }
        ]
    }),
    createModelTwo: {
        data: {
            text: {
                values: [
                    {
                        locale: locales.en.id,
                        value: "Model Two"
                    },
                    {
                        locale: locales.de.id,
                        value: "Model Two"
                    }
                ]
            }
        }
    }
};
