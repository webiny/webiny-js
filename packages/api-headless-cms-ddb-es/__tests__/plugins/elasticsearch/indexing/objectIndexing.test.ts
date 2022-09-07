import { createGraphQLFields } from "@webiny/api-headless-cms";
import defaultIndexingPlugin from "~/elasticsearch/indexing/defaultFieldIndexing";
import objectIndexing from "~/elasticsearch/indexing/objectIndexing";
import elasticsearchIndexingPlugins from "~/elasticsearch/indexing";
import { CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";
import { CmsModelFieldToElasticsearchPlugin } from "~/types";

const indexingPlugins = elasticsearchIndexingPlugins();
const fieldTypePlugins = createGraphQLFields();

const getFieldIndexPlugin = (fieldType: string) => {
    return indexingPlugins.find(pl => pl.fieldType === fieldType) || defaultIndexingPlugin();
};

const getFieldTypePlugin = (fieldType: string) => {
    return fieldTypePlugins.find(pl => pl.fieldType === fieldType) as CmsModelFieldToGraphQLPlugin;
};

const objectField = {
    storageId: "page",
    type: "object",
    settings: {
        fields: [
            {
                storageId: "title",
                type: "text"
            },
            {
                storageId: "number",
                type: "number"
            },
            {
                storageId: "richText",
                type: "rich-text"
            },
            {
                storageId: "settings",
                type: "object",
                settings: {
                    fields: [
                        {
                            storageId: "title",
                            type: "text"
                        },
                        {
                            storageId: "snippet",
                            type: "rich-text"
                        },
                        {
                            storageId: "options",
                            type: "object",
                            multipleValues: true,
                            settings: {
                                fields: [
                                    {
                                        storageId: "title",
                                        type: "text"
                                    },
                                    {
                                        storageId: "price",
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
        const plugin = objectIndexing() as Required<CmsModelFieldToElasticsearchPlugin>;
        const result = plugin.toIndex({
            value: input,
            rawValue: input,
            field: objectField as any,
            getFieldIndexPlugin,
            getFieldTypePlugin,
            plugins: {} as any,
            model: {} as any
        });

        expect(result.value).toEqual(expectedValue);
        expect(result.rawValue).toEqual(expectedRawValue);
    });

    test("fromIndex should recursively transform an object", () => {
        const plugin = objectIndexing() as Required<CmsModelFieldToElasticsearchPlugin>;
        const result = plugin.fromIndex({
            value: expectedValue,
            rawValue: expectedRawValue,
            field: objectField as any,
            getFieldIndexPlugin,
            getFieldTypePlugin,
            plugins: {} as any,
            model: {} as any
        });

        expect(result).toEqual(input);
    });
});
