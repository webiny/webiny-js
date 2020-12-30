import defaultFieldIndexPlugin from "../../../../src/content/plugins/es/indexing/defaultFieldIndexPlugin";
import {
    CmsContentEntryType,
    CmsContentModelFieldType,
    CmsModelFieldToGraphQLPlugin
} from "@webiny/api-headless-cms/types";

const mockRichTextValue = [
    {
        tag: "p",
        content: "some long text"
    }
];
const mockTextValue = "some short searchable text";
const mockContext: any = {};
const mockModel: any = {};
const mockInputEntry: Partial<CmsContentEntryType> = {
    values: {
        notAffectedNumber: 1,
        notAffectedString: "some text",
        notAffectedObject: {
            test: true
        },
        notAffectedArray: ["first", "second"],
        richText: mockRichTextValue,
        text: mockTextValue
    }
};
const mockIndexedEntry: Partial<CmsContentEntryType> & Record<string, any> = {
    values: {
        notAffectedNumber: 1,
        notAffectedString: "some text",
        notAffectedObject: {
            test: true
        },
        notAffectedArray: ["first", "second"],
        text: mockTextValue
    },
    rawData: {
        richText: mockRichTextValue
    }
};
const mockRichTextField: CmsContentModelFieldType = {
    id: "richTextField",
    type: "rich-text",
    label: "Rich text",
    validation: [],
    multipleValues: false,
    renderer: {
        name: "any"
    },
    fieldId: "richText",
    predefinedValues: {
        enabled: false,
        values: []
    },
    placeholderText: "rich-text",
    helpText: "rich-text"
};
const mockRichTextFieldTypePlugin: CmsModelFieldToGraphQLPlugin = {
    type: "cms-model-field-to-graphql",
    fieldType: "rich-text",
    isSearchable: false,
    isSortable: false,
    manage: {} as any,
    read: {} as any
};
const mockTextFieldTypePlugin: CmsModelFieldToGraphQLPlugin = {
    type: "cms-model-field-to-graphql",
    fieldType: "text",
    isSearchable: true,
    isSortable: true,
    manage: {} as any,
    read: {} as any
};
const mockTextField: CmsContentModelFieldType = {
    id: "textField",
    type: "text",
    label: "Plain text",
    validation: [],
    multipleValues: false,
    renderer: {
        name: "any"
    },
    fieldId: "textField",
    predefinedValues: {
        enabled: false,
        values: []
    },
    placeholderText: "Plain text",
    helpText: "Plain text"
};

describe("defaultFieldIndexPlugin", () => {
    test("toIndex should return transformed objects", () => {
        const plugin = defaultFieldIndexPlugin();

        const result = plugin.toIndex({
            entry: mockInputEntry as any,
            field: mockRichTextField,
            model: mockModel,
            value: mockRichTextValue,
            context: mockContext,
            fieldTypePlugin: mockRichTextFieldTypePlugin
        });

        expect(result).toEqual(mockIndexedEntry);
    });

    test("fromIndex should return transformed objects", () => {
        const plugin = defaultFieldIndexPlugin();
        const result = plugin.fromIndex({
            entry: mockIndexedEntry as any,
            field: mockRichTextField,
            model: mockModel,
            context: mockContext,
            fieldTypePlugin: mockRichTextFieldTypePlugin
        });

        // we receive a bit different output than in toIndex since here we take field from rawData and put it into values obj
        // it is being merged into new entry after that
        expect(result).toEqual({
            values: {
                richText: mockRichTextValue
            },
            rawData: {}
        });
    });

    test("toIndex should return empty object since field is searchable", () => {
        const plugin = defaultFieldIndexPlugin();

        const result = plugin.toIndex({
            entry: mockInputEntry as any,
            field: mockTextField,
            model: mockModel,
            value: mockTextValue,
            context: mockContext,
            fieldTypePlugin: mockTextFieldTypePlugin
        });

        expect(result).toEqual({});
    });

    test("fromIndex should return empty object since field is searchable", () => {
        const plugin = defaultFieldIndexPlugin();

        const result = plugin.fromIndex({
            entry: mockIndexedEntry as any,
            field: mockTextField,
            model: mockModel,
            context: mockContext,
            fieldTypePlugin: mockTextFieldTypePlugin
        });

        expect(result).toEqual({});
    });
});
