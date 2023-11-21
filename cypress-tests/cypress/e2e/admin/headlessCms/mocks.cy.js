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

export const getAuthorContentModelData = modelId => ({
    layout: [["jxoS0C7r6"], ["Q3E6CJkaQ"]],
    fields: [
        {
            type: "text",
            label: "Name",
            id: "jxoS0C7r6",
            fieldId: "name",
            validation: [],
            multipleValues: false,
            renderer: {
                name: "text-input"
            }
        },
        {
            type: "ref",
            label: "Books",
            id: "Q3E6CJkaQ",
            fieldId: "books",
            validation: [],
            multipleValues: true,
            renderer: {
                name: "ref-inputs"
            },
            settings: {
                models: [
                    {
                        modelId
                    }
                ]
            }
        }
    ]
});

export const BOOK_CONTENT_MODEL_DATA = {
    layout: [["PUp1vtslZ"]],
    fields: [
        {
            type: "text",
            label: "Title",
            id: "PUp1vtslZ",
            fieldId: "title",
            validation: [],
            multipleValues: false,
            renderer: {
                name: "text-input"
            }
        }
    ]
};

export const getBookContentModelData = modelId => ({
    layout: [["PUp1vtslZ"], ["YDWl_3GPC"]],
    fields: [
        {
            type: "text",
            label: "Title",
            id: "PUp1vtslZ",
            fieldId: "title",
            validation: [],
            multipleValues: false,
            renderer: {
                name: "text-input"
            }
        },
        {
            type: "ref",
            label: "Author",
            id: "YDWl_3GPC",
            fieldId: "author",
            validation: [],
            multipleValues: false,
            renderer: {
                name: "ref-input"
            },
            settings: {
                models: [
                    {
                        modelId
                    }
                ]
            }
        }
    ]
});
