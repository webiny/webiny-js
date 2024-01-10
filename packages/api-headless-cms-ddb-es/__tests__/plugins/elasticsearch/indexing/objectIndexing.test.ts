import { createGraphQLFields } from "@webiny/api-headless-cms";
import defaultIndexingPlugin from "~/elasticsearch/indexing/defaultFieldIndexing";
import objectIndexing from "~/elasticsearch/indexing/objectIndexing";
import elasticsearchIndexingPlugins from "~/elasticsearch/indexing";
import { CmsModelField, CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";
import {
    CmsModelFieldToElasticsearchFromParams,
    CmsModelFieldToElasticsearchPlugin,
    CmsModelFieldToElasticsearchToParams
} from "~/types";

const indexingPlugins = elasticsearchIndexingPlugins();
const fieldTypePlugins = createGraphQLFields();

const getFieldIndexPlugin = (fieldType: string) => {
    return indexingPlugins.find(pl => pl.fieldType === fieldType) || defaultIndexingPlugin();
};

const getFieldTypePlugin = (fieldType: string) => {
    return fieldTypePlugins.find(pl => pl.fieldType === fieldType) as CmsModelFieldToGraphQLPlugin;
};

const objectField: CmsModelField = {
    id: "101",
    label: "Page",
    fieldId: "page",
    storageId: "pageStorageId",
    type: "object",
    settings: {
        fields: [
            {
                fieldId: "title",
                storageId: "titleStorageId",
                type: "text",
                id: "1",
                label: "Title"
            },
            {
                fieldId: "number",
                storageId: "numberStorageId",
                type: "number",
                id: "2",
                label: "Number"
            },
            {
                fieldId: "richText",
                storageId: "richTextStorageId",
                type: "rich-text",
                id: "3",
                label: "Rich Text"
            },
            {
                fieldId: "settings",
                storageId: "settingsStorageId",
                type: "object",
                settings: {
                    fields: [
                        {
                            fieldId: "title",
                            storageId: "titleStorageId",
                            type: "text",
                            id: "41",
                            label: "Settings title"
                        },
                        {
                            fieldId: "snippet",
                            storageId: "snippetStorageId",
                            type: "rich-text",
                            id: "42",
                            label: "Settings Rich Text"
                        },
                        {
                            fieldId: "options",
                            storageId: "optionsStorageId",
                            type: "object",
                            multipleValues: true,
                            settings: {
                                fields: [
                                    {
                                        fieldId: "title",
                                        storageId: "titleStorageId",
                                        type: "text",
                                        id: "431",
                                        label: "Options Title"
                                    },
                                    {
                                        fieldId: "price",
                                        storageId: "price",
                                        type: "number",
                                        id: "432",
                                        label: "Options Price"
                                    }
                                ]
                            },
                            id: "43",
                            label: "Settings Object"
                        }
                    ]
                },
                id: "4",
                label: "Settings"
            }
        ]
    }
};

const input = {
    titleStorageId: "Title",
    numberStorageId: 155.75,
    richTextStorageId: [
        {
            tag: "p",
            content: "full"
        }
    ],
    settingsStorageId: {
        titleStorageId: "Settings Title",
        snippetStorageId: [
            {
                tag: "p",
                content: "snippet"
            }
        ],
        optionsStorageId: [
            {
                titleStorageId: "Option 1",
                price: 100
            },
            {
                titleStorageId: "Option 2",
                price: 200
            }
        ]
    }
};

const expectedValue = {
    titleStorageId: "Title",
    numberStorageId: 155.75,
    settingsStorageId: {
        titleStorageId: "Settings Title",
        optionsStorageId: [
            {
                titleStorageId: "Option 1",
                price: 100
            },
            {
                titleStorageId: "Option 2",
                price: 200
            }
        ]
    }
};

const expectedRawValue = {
    richTextStorageId: [
        {
            tag: "p",
            content: "full"
        }
    ],
    settingsStorageId: {
        optionsStorageId: [{}, {}],
        snippetStorageId: [
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
            field: objectField,
            getFieldIndexPlugin,
            getFieldTypePlugin,
            plugins: {},
            model: {}
        } as CmsModelFieldToElasticsearchToParams);

        expect(result.value).toEqual(expectedValue);
        expect(result.rawValue).toEqual(expectedRawValue);
    });

    test("fromIndex should recursively transform an object", () => {
        const plugin = objectIndexing() as Required<CmsModelFieldToElasticsearchPlugin>;
        const result = plugin.fromIndex({
            value: expectedValue,
            rawValue: expectedRawValue,
            field: objectField,
            getFieldIndexPlugin,
            getFieldTypePlugin,
            plugins: {},
            model: {}
        } as CmsModelFieldToElasticsearchFromParams);

        expect(result).toEqual(input);
    });
});
