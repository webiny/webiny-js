import { describe, expect, it } from "vitest";
import richTextIndexingPlugin from "~/elasticsearch/indexing/richTextIndexing";
import type { CmsModelField } from "@webiny/api-headless-cms/types";
import { PluginsContainer } from "@webiny/plugins";
import type { CmsModelFieldToElasticsearchPlugin } from "~/types";
import { CmsModelFieldToGraphQLRegistry } from "@webiny/api-headless-cms/features/graphql/index.js";

const mockValue = [
    {
        tag: "p",
        content: "some long text"
    }
];
const mockModel: any = {};

const mockField: CmsModelField = {
    id: "textField",
    type: "text",
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

const getFieldType = () => {
    return undefined;
};

const getFieldIndexPlugin = () => {
    return null as unknown as CmsModelFieldToElasticsearchPlugin;
};

const fieldRegistry: CmsModelFieldToGraphQLRegistry.Interface = {
    get: () => {
        return undefined;
    },
    getAll: () => {
        return [];
    }
};

describe("richTextIndexing", () => {
    it("toIndex should return transformed objects", () => {
        const plugin = richTextIndexingPlugin() as Required<CmsModelFieldToElasticsearchPlugin>;

        const result = plugin.toIndex({
            value: mockValue,
            rawValue: mockValue,
            field: mockField,
            model: mockModel,
            plugins: new PluginsContainer(),
            getFieldType,
            getFieldIndexPlugin,
            fieldRegistry
        });

        expect(result).toEqual({
            rawValue: mockValue
        });
    });

    it("fromIndex should return transformed objects", () => {
        const plugin = richTextIndexingPlugin() as Required<CmsModelFieldToElasticsearchPlugin>;
        const result = plugin.fromIndex({
            value: undefined,
            rawValue: mockValue,
            field: mockField,
            model: mockModel,
            plugins: new PluginsContainer(),
            getFieldType,
            getFieldIndexPlugin,
            fieldRegistry
        });

        expect(result).toEqual(mockValue);
    });
});
