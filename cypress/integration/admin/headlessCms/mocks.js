export const CONTENT_MODEL_DATA = {
    layout: [["KIpyfhIzb"], ["y6Pe59AYa"]],
    fields: [
        {
            type: "text",
            validation: [
                {
                    name: "required",
                    message: "Value is required."
                }
            ],
            renderer: {
                name: "text-input"
            },
            label: "Title",
            fieldId: "title",
            helpText: "What should we call it?",
            placeholderText: "Think and Grow Rich",
            predefinedValues: {
                enabled: false,
                values: []
            },
            id: "KIpyfhIzb"
        },
        {
            type: "number",
            validation: [
                {
                    name: "required",
                    message: "Value is required."
                }
            ],
            renderer: {
                name: "number-input"
            },
            label: "Edition",
            fieldId: "edition",
            id: "y6Pe59AYa",
            predefinedValues: {
                enabled: false,
                values: []
            }
        }
    ]
};
