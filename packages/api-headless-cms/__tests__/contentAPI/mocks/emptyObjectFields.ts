import { CmsModel } from "~/types";

export const emptyObjectFields: Partial<CmsModel> = {
    layout: [["nonestedfieldsobject"], ["T87zmyqoF"]],
    fields: [
        {
            id: "nonestedfieldsobject",
            multipleValues: false,
            helpText: "",
            label: "No fields object",
            fieldId: "noFieldsObject",
            type: "object",
            settings: {
                fields: []
            },
            validation: [],
            listValidation: [],
            placeholderText: "",
            predefinedValues: {
                enabled: false,
                values: []
            },
            renderer: {
                name: "renderer"
            }
        },
        {
            multipleValues: true,
            listValidation: [],
            settings: {
                fields: [
                    {
                        multipleValues: true,
                        settings: {
                            fields: [],
                            layout: []
                        },
                        listValidation: [],
                        renderer: {
                            name: "objects"
                        },
                        label: "Repeat",
                        id: "X2TQojXka",
                        type: "object",
                        validation: [],
                        fieldId: "repeat"
                    }
                ],
                layout: [["123"]]
            },
            renderer: {
                name: "objects"
            },
            helpText: null,
            placeholderText: null,
            predefinedValues: {
                enabled: false,
                values: []
            },
            id: "T87zmyqoF",
            label: "AnotherOne",
            type: "object",
            validation: [],
            fieldId: "anotherOne"
        }
    ]
};
