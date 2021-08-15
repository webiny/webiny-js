import richTextStoragePlugin from "../../../../src/dynamoDb/storage/richText";

const defaultArgs = {
    field: {
        fieldId: "richTextFieldId"
    },
    model: {
        modelId: "richTextModel"
    },
    entry: {
        savedOn: new Date()
    }
};

const testValue = [
    {
        h1: "big title",
        h2: "small title"
    },
    {
        h3: "subtitle",
        p: "subtitle description"
    },
    {
        number919: 919,
        boolTrue: true,
        boolFalse: false,
        textYes: "yes",
        content: [
            {
                p: "start of the text",
                a: {
                    text: "url",
                    href: "https://www.webiny.com"
                }
            },
            {
                p: "end of the text",
                a: {
                    text: "more url",
                    href: "https://www.webiny.com",
                    target: "_blank"
                }
            }
        ]
    }
];

const expectedCompressedValue =
    "h1|big+title|h2|small+title|h3|subtitle|p|subtitle+description|number919|boolTrue|boolFalse|textYes|yes|content|start+of+the+text|a|text|url|href|https://www.webiny.com|end+of+the+text|more+url|target|_blank^PJ^^@$0|1|2|3]|$4|5|6|7]|$8|O|9|-1|A|-2|B|C|D|@$6|E|F|$G|H|I|J]]|$6|K|F|$G|L|I|J|M|N]]]]]";

describe("richTextStoragePlugin", () => {
    test("toStorage should transform value for storage", async () => {
        const plugin = richTextStoragePlugin();

        const result = await plugin.toStorage({
            ...defaultArgs,
            value: testValue
        } as any);

        expect(result).toEqual({
            compression: "jsonpack",
            value: expectedCompressedValue
        });
    });

    test("fromStorage should transform value for output", async () => {
        const value = {
            compression: "jsonpack",
            value: expectedCompressedValue
        };
        const plugin = richTextStoragePlugin();

        const result = await plugin.fromStorage({
            ...defaultArgs,
            value
        } as any);

        expect(result).toEqual(testValue);
    });
});
