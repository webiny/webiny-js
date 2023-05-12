import { CmsModel } from "~/types";

export const emptyObjectFields: Pick<CmsModel, "fields" | "layout"> = {
    layout: [["T87zmyqoF"]],
    fields: [
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
                        storageId: "repeat",
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
            storageId: "anotherOne",
            fieldId: "anotherOne"
        }
    ]
};
