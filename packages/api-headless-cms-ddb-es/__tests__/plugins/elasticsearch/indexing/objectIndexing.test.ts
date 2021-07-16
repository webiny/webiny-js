import cmsFieldTypePlugins from "@webiny/api-headless-cms/content/plugins/graphqlFields";
import defaultIndexingPlugin from "~/elasticsearch/indexing/defaultFieldIndexing";
import objectIndexing from "~/elasticsearch/indexing/objectIndexing";
import elasticsearchIndexingPlugins from "~/elasticsearch/indexing";

const indexingPlugins = elasticsearchIndexingPlugins();
const fieldTypePlugins = cmsFieldTypePlugins();

const getFieldIndexPlugin = (fieldType: string) => {
    return indexingPlugins.find(pl => pl.fieldType === fieldType) || defaultIndexingPlugin();
};

const getFieldTypePlugin = (fieldType: string) => {
    return fieldTypePlugins.find(pl => pl.fieldType === fieldType);
};

const objectField = {
    fieldId: "page",
    type: "object",
    settings: {
        fields: [
            {
                fieldId: "title",
                type: "text"
            },
            {
                fieldId: "number",
                type: "number"
            },
            {
                fieldId: "richText",
                type: "rich-text"
            },
            {
                fieldId: "settings",
                type: "object",
                settings: {
                    fields: [
                        {
                            fieldId: "title",
                            type: "text"
                        },
                        {
                            fieldId: "snippet",
                            type: "rich-text"
                        },
                        {
                            fieldId: "options",
                            type: "object",
                            multipleValues: true,
                            settings: {
                                fields: [
                                    {
                                        fieldId: "title",
                                        type: "text"
                                    },
                                    {
                                        fieldId: "price",
                                        type: "number"
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        ]
    }
};

const input = {
    title: "Title",
    number: 155.75,
    richText: [
        {
            tag: "p",
            content: "full"
        }
    ],
    settings: {
        title: "Settings Title",
        snippet: [
            {
                tag: "p",
                content: "snippet"
            }
        ],
        options: [
            { title: "Option 1", price: 100 },
            { title: "Option 2", price: 200 }
        ]
    }
};

const expectedValue = {
    title: "Title",
    number: 155.75,
    settings: {
        title: "Settings Title",
        options: [
            { title: "Option 1", price: 100 },
            { title: "Option 2", price: 200 }
        ]
    }
};

const expectedRawValue = {
    richText: [
        {
            tag: "p",
            content: "full"
        }
    ],
    settings: {
        snippet: [
            {
                tag: "p",
                content: "snippet"
            }
        ]
    }
};

describe("objectIndexing", () => {
    test("toIndex should recursively transform an object", () => {
        const plugin = objectIndexing();
        const result = plugin.toIndex({
            value: input,
            field: objectField,
            getFieldIndexPlugin,
            getFieldTypePlugin,
            context: {},
            model: {}
        } as any);

        expect(result.value).toEqual(expectedValue);
        expect(result.rawValue).toEqual(expectedRawValue);
    });

    test("fromIndex should recursively transform an object", () => {
        const plugin = objectIndexing();
        const result = plugin.fromIndex({
            value: expectedValue,
            rawValue: expectedRawValue,
            field: objectField,
            getFieldIndexPlugin,
            getFieldTypePlugin,
            context: {},
            model: {}
        } as any);

        expect(result).toEqual(input);
    });
});
