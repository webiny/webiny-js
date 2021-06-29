// @ts-ignore
import longTextIndexing from "../../../../src/elasticsearch/indexing/longTextIndexing";
import lodashCloneDeep from "lodash.clonedeep";
import {
    CmsContentEntry,
    CmsContentModelField,
    CmsModelFieldToGraphQLPlugin
} from "@webiny/api-headless-cms/types";

const mockValue = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`;
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
        reallyLongText: mockValue
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
        reallyLongText: mockValue
    }
};
const mockIndexedEntryFromOldVersion: Partial<CmsContentEntry> & Record<string, any> = {
    values: {
        notAffectedNumber: 1,
        notAffectedString: "some text",
        notAffectedObject: {
            test: true
        },
        notAffectedArray: ["first", "second"],
        reallyLongText: mockValue
    },
    rawValues: {}
};
const mockField: CmsContentModelField = {
    id: "textField",
    type: "long-text",
    label: "Text",
    validation: [],
    listValidation: [],
    multipleValues: false,
    renderer: {
        name: "any"
    },
    fieldId: "reallyLongText",
    predefinedValues: {
        enabled: false,
        values: []
    },
    placeholderText: "text",
    helpText: "text"
};
const mockFieldTypePlugin: CmsModelFieldToGraphQLPlugin = {
    type: "cms-model-field-to-graphql",
    fieldType: "long-text",
    isSearchable: false,
    isSortable: false,
    manage: {} as any,
    read: {} as any
};

describe("longTextIndexing", () => {
    test("toIndex should return transformed objects", () => {
        const plugin = longTextIndexing();

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
        const plugin = longTextIndexing();
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
                reallyLongText: mockValue
            },
            rawValues: {}
        });
    });

    test("fromIndex should return transformed objects from older versions (backward compatibility)", () => {
        const plugin = longTextIndexing();
        const result = plugin.fromIndex({
            entry: lodashCloneDeep(mockIndexedEntryFromOldVersion) as any,
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
                reallyLongText: mockValue
            },
            rawValues: {}
        });
    });
});
