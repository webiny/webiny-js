import richTextIndexing from "../../../../src/elasticsearch/indexing/richTextIndexing";
import lodashCloneDeep from "lodash.clonedeep";
import {
    CmsContentEntry,
    CmsContentModelField,
    CmsModelFieldToGraphQLPlugin
} from "@webiny/api-headless-cms/types";

const mockValue = [
    {
        tag: "p",
        content: "some long text"
    }
];
const mockContext: any = {};
const mockModel: any = {};
const mockInputEntry: Partial<CmsContentEntry> = {
    values: {
        notAffectedNumber: 1,
        notAffectedString: "some text",
        notAffectedObject: {
            test: true
        },
        notAffectedArray: ["first", "second"],
        text: mockValue
    }
};
const mockIndexedEntry: Partial<CmsContentEntry> & Record<string, any> = {
    values: {
        notAffectedNumber: 1,
        notAffectedString: "some text",
        notAffectedObject: {
            test: true
        },
        notAffectedArray: ["first", "second"]
    },
    rawValues: {
        text: mockValue
    }
};
const mockField: CmsContentModelField = {
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
const mockFieldTypePlugin: CmsModelFieldToGraphQLPlugin = {
    type: "cms-model-field-to-graphql",
    fieldType: "text",
    isSearchable: false,
    isSortable: false,
    manage: {} as any,
    read: {} as any
};

describe("richTextIndexing", () => {
    test("toIndex should return transformed objects", () => {
        const plugin = richTextIndexing();

        const result = plugin.toIndex({
            toIndexEntry: lodashCloneDeep(mockInputEntry) as any,
            originalEntry: lodashCloneDeep(mockInputEntry) as any,
            storageEntry: lodashCloneDeep(mockInputEntry) as any,
            field: mockField,
            model: mockModel,
            context: mockContext,
            fieldTypePlugin: mockFieldTypePlugin
        });

        // here we receive new values and rawValues objects that are populated, in rawValues case, and values being without given fieldId
        expect(result).toEqual(mockIndexedEntry);
    });

    test("fromIndex should return transformed objects", () => {
        const plugin = richTextIndexing();
        const result = plugin.fromIndex({
            entry: lodashCloneDeep(mockIndexedEntry) as any,
            field: mockField,
            model: mockModel,
            context: mockContext,
            fieldTypePlugin: mockFieldTypePlugin
        });

        // we receive a bit different output than in toIndex since here we take field from rawValues and put it into values obj
        // it is being merged into new entry after that
        expect(result).toEqual({
            values: {
                notAffectedNumber: 1,
                notAffectedString: "some text",
                notAffectedObject: {
                    test: true
                },
                notAffectedArray: ["first", "second"],
                text: mockValue
            },
            rawValues: {}
        });
    });
});
