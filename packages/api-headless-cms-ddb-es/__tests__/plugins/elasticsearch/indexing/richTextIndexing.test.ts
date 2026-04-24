import { describe, expect, it } from "vitest";
import type { CmsModelField } from "@webiny/api-headless-cms/types";
import { CmsEntryOpenSearchFieldIndexRegistry } from "~/features/CmsEntryOpenSearchFieldIndex";
import { createTestContainer } from "~tests/helpers/createTestContainer";
import { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/features/graphql/index.js";

const container = createTestContainer();
const fieldIndexRegistry = container.resolve(CmsEntryOpenSearchFieldIndexRegistry);
const fieldRegistry = container.resolve(CmsModelFieldToGraphQLRegistry);

const mockValue = [
    {
        tag: "p",
        content: "some long text"
    }
];
const mockModel: any = {};

const mockField: CmsModelField = {
    id: "textField",
    type: "rich-text",
    label: "Text",
    validation: [],
    listValidation: [],
    list: false,
    renderer: {
        name: "any"
    },
    storageId: "text",
    fieldId: "text",
    predefinedValues: {
        enabled: false,
        values: []
    },
    placeholder: "text",
    help: "text"
};

const getFieldIndex = (type: string) => {
    return fieldIndexRegistry.get(type) || fieldIndexRegistry.getDefault();
};

describe("richTextIndexing", () => {
    const plugin = fieldIndexRegistry.get("rich-text")!;

    it("toIndex should return transformed objects", () => {
        const result = plugin.toIndex({
            value: mockValue,
            rawValue: mockValue,
            field: mockField,
            model: mockModel,
            getFieldIndex,
            fieldRegistry
        });

        expect(result).toEqual({
            rawValue: mockValue
        });
    });

    it("fromIndex should return transformed objects", () => {
        const result = plugin.fromIndex({
            value: undefined,
            rawValue: mockValue,
            field: mockField,
            model: mockModel,
            getFieldIndex,
            fieldRegistry
        });

        expect(result).toEqual(mockValue);
    });
});
