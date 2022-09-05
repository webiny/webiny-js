import richTextIndexingPlugin from "~/elasticsearch/indexing/richTextIndexing";
import { CmsModelField, CmsModelFieldToGraphQLPlugin } from "@webiny/api-headless-cms/types";
import { PluginsContainer } from "@webiny/plugins";
import { CmsModelFieldToElasticsearchPlugin } from "~/types";

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
    multipleValues: false,
    renderer: {
        name: "any"
    },
    fieldId: "text",
    predefinedValues: {
        enabled: false,
        values: []
    },
    placeholderText: "text",
    helpText: "text"
};

const getFieldTypePlugin = (): CmsModelFieldToGraphQLPlugin => {
    return null as unknown as CmsModelFieldToGraphQLPlugin;
};

const getFieldIndexPlugin = () => {
    return null as unknown as CmsModelFieldToElasticsearchPlugin;
};

describe("richTextIndexing", () => {
    test("toIndex should return transformed objects", () => {
        const plugin = richTextIndexingPlugin() as Required<CmsModelFieldToElasticsearchPlugin>;

        const result = plugin.toIndex({
            value: mockValue,
            rawValue: mockValue,
            field: mockField,
            model: mockModel,
            plugins: new PluginsContainer(),
            getFieldTypePlugin,
            getFieldIndexPlugin
        });

        // here we receive new values and rawValues objects that are populated, in rawValues case, and values being without given fieldId
        expect(result).toEqual({
            rawValue: mockValue
        });
    });

    test("fromIndex should return transformed objects", () => {
        const plugin = richTextIndexingPlugin() as Required<CmsModelFieldToElasticsearchPlugin>;
        const result = plugin.fromIndex({
            value: undefined,
            rawValue: mockValue,
            field: mockField,
            model: mockModel,
            plugins: new PluginsContainer(),
            getFieldTypePlugin,
            getFieldIndexPlugin
        });

        // we receive a bit different output than in toIndex since here we take field from rawValues and put it into values obj
        // it is being merged into new entry after that
        expect(result).toEqual(mockValue);
    });
});
