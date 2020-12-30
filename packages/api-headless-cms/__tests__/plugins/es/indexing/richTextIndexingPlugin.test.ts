import richTextIndexing from "../../../../src/content/plugins/es/indexing/richTextIndexing";
import { CmsContentEntryType } from "@webiny/api-headless-cms/types";

const mockValue = [
    {
        tag: "p",
        content: "some long text"
    }
];
const mockContext: any = {};
const mockModel: any = {};
const mockEntry: Partial<CmsContentEntryType> = {
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
const mockField: any = {
    fieldId: "text"
};

describe("richTextIndexing", () => {
    test("toIndex should return correct objects", () => {
        const plugin = richTextIndexing();

        const result = plugin.toIndex({
            entry: mockEntry as any,
            field: mockField,
            model: mockModel,
            value: mockValue,
            context: mockContext
        });

        expect(result).toEqual({
            values: {
                notAffectedNumber: 1,
                notAffectedString: "some text",
                notAffectedObject: {
                    test: true
                },
                notAffectedArray: ["first", "second"]
            },
            rawData: {
                text: mockValue
            }
        });
    });
});
