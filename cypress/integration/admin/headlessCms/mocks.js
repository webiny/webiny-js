export const CONTENT_MODEL_DATA = {
    layout: [["kipyfhizb"], ["ygpespaya"]],
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
            alias: "title",
            fieldId: "title@text@kipyfhizb",
            helpText: "What should we call it?",
            placeholderText: "Think and Grow Rich",
            predefinedValues: {
                enabled: false,
                values: []
            },
            id: "kipyfhizb"
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
            alias: "edition",
            fieldId: "edition@number@ygpespaya",
            id: "ygpespaya",
            predefinedValues: {
                enabled: false,
                values: []
            }
        }
    ]
};

export const getAuthorContentModelData = modelId => ({
    layout: [["jxosoctrg"], ["qeegcjkaq"]],
    fields: [
        {
            type: "text",
            label: "Name",
            id: "jxosoctrg",
            alias: "name",
            fieldId: "name@text@jxosoctrg",
            validation: [],
            multipleValues: false,
            renderer: {
                name: "text-input"
            }
        },
        {
            type: "ref",
            label: "Books",
            id: "qeegcjkaq",
            alias: "books",
            fieldId: "books@ref@qeegcjkaq",
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
    layout: [["pupivtslz"]],
    fields: [
        {
            type: "text",
            label: "Title",
            id: "pupivtslz",
            alias: "title",
            fieldId: "title@text@pupivtslz",
            validation: [],
            multipleValues: false,
            renderer: {
                name: "text-input"
            }
        }
    ]
};

export const getBookContentModelData = modelId => ({
    layout: [["pupivtslz"], ["ydwluegpc"]],
    fields: [
        {
            type: "text",
            label: "Title",
            id: "pupivtslz",
            alias: "title",
            fieldId: "title@text@pupivtslz",
            validation: [],
            multipleValues: false,
            renderer: {
                name: "text-input"
            }
        },
        {
            type: "ref",
            label: "Author",
            id: "ydwluegpc",
            alias: "author",
            fieldId: "author@ref@ydwluegpc",
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
