import { describe, expect, it } from "vitest";
import { createTestContainer } from "~tests/helpers/createTestContainer";
import { CmsEntryOpenSearchFieldIndexRegistry } from "~/features/CmsEntryOpenSearchFieldIndex";
import { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/features/graphql/index.js";
import type { CmsModelField } from "@webiny/api-headless-cms/types/index.js";

const container = createTestContainer();
const fieldIndexRegistry = container.resolve(CmsEntryOpenSearchFieldIndexRegistry);
const fieldRegistry = container.resolve(CmsModelFieldToGraphQLRegistry);

const getFieldIndex = (type: string) => {
    return fieldIndexRegistry.get(type) || fieldIndexRegistry.getDefault();
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
                label: "Title",
                validation: [],
                listValidation: []
            },
            {
                fieldId: "number",
                storageId: "numberStorageId",
                type: "number",
                id: "2",
                label: "Number",
                validation: [],
                listValidation: []
            },
            {
                fieldId: "richText",
                storageId: "richTextStorageId",
                type: "rich-text",
                id: "3",
                label: "Rich Text",
                validation: [],
                listValidation: []
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
                            label: "Settings title",
                            validation: [],
                            listValidation: []
                        },
                        {
                            fieldId: "snippet",
                            storageId: "snippetStorageId",
                            type: "rich-text",
                            id: "42",
                            label: "Settings Rich Text",
                            validation: [],
                            listValidation: []
                        },
                        {
                            fieldId: "options",
                            storageId: "optionsStorageId",
                            type: "object",
                            list: true,
                            settings: {
                                fields: [
                                    {
                                        fieldId: "title",
                                        storageId: "titleStorageId",
                                        type: "text",
                                        id: "431",
                                        label: "Options Title",
                                        validation: [],
                                        listValidation: []
                                    },
                                    {
                                        fieldId: "price",
                                        storageId: "price",
                                        type: "number",
                                        id: "432",
                                        label: "Options Price",
                                        validation: [],
                                        listValidation: []
                                    }
                                ]
                            },
                            id: "43",
                            label: "Settings Object",
                            validation: [],
                            listValidation: []
                        }
                    ]
                },
                id: "4",
                label: "Settings",
                validation: [],
                listValidation: []
            }
        ]
    },
    validation: [],
    listValidation: []
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
    const plugin = fieldIndexRegistry.get("object")!;

    it("toIndex should recursively transform an object", () => {
        const result = plugin.toIndex({
            value: input,
            rawValue: input,
            field: objectField,
            getFieldIndex,
            model: {} as any,
            fieldRegistry
        });

        expect(result.value).toEqual(expectedValue);
        expect(result.rawValue).toEqual(expectedRawValue);
    });

    it("fromIndex should recursively transform an object", () => {
        const result = plugin.fromIndex({
            value: expectedValue,
            rawValue: expectedRawValue,
            field: objectField,
            getFieldIndex,
            model: {} as any,
            fieldRegistry
        });

        expect(result).toEqual(input);
    });
});
