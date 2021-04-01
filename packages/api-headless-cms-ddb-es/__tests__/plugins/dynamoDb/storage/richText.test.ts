import richTextStoragePlugin from "../../../../src/dynamoDb/storage/richText";

describe("richTextStoragePlugin", () => {
    test("toStorage should transform value for storage", async () => {
        const value = {
            text: "yes",
            num: 2,
            obj: {
                bool: true,
                list: ["item1", "item2"]
            }
        };
        const plugin = richTextStoragePlugin();

        const result = await plugin.toStorage({
            value
        } as any);

        expect(result).toEqual({
            compression: "jsonpack",
            value: "text|yes|num|obj|bool|list|item1|item2^2^^$0|1|2|8|3|$4|-1|5|@6|7]]]"
        });
    });

    test("fromStorage should transform value for output", async () => {
        const value = {
            compression: "jsonpack",
            value: "text|no|num|obj|bool|list|item3|item4^BMZLZ^^$0|1|2|8|3|$4|-2|5|@6|7]]]"
        };
        const plugin = richTextStoragePlugin();

        const result = await plugin.fromStorage({
            field: {
                fieldId: "testFieldId"
            },
            model: {
                modelId: "56789"
            },
            entry: {
                savedOn: "2021-03-31T14:39:29.000Z"
            },
            value
        } as any);

        expect(result).toEqual({
            text: "no",
            num: 19548359,
            obj: {
                bool: false,
                list: ["item3", "item4"]
            }
        });
    });
});
