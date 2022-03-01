import { PluginsContainer } from "@webiny/plugins";
import filterPlugins from "~/plugins/filters";
import { ValueFilterPlugin } from "~/plugins/definitions/ValueFilterPlugin";

describe("filters", () => {
    let plugins: PluginsContainer;

    beforeEach(() => {
        plugins = new PluginsContainer();
        plugins.register(filterPlugins());
    });

    const operations = [
        ["eq"],
        ["and_in"],
        ["in"],
        ["gt"],
        ["gte"],
        ["lt"],
        ["lte"],
        ["contains"],
        ["between"],
        ["fuzzy"],
        ["startsWith"]
    ];

    const findFilterPlugin = (operation: string): ValueFilterPlugin => {
        const byType = plugins.byType<ValueFilterPlugin>(ValueFilterPlugin.type);

        return byType.find(plugin => plugin.operation === operation);
    };

    test.each(operations)("has the filter plugin registered - %s", (operation: string) => {
        const exists = findFilterPlugin(operation) !== undefined;

        expect(exists).toBe(true);
    });

    const equalList = [
        [1, 1],
        [932, 932],
        ["some text", "some text"],
        [true, true],
        [false, false]
    ];
    test.each(equalList)("values should be equal", (value: any, compareValue: any) => {
        const plugin = findFilterPlugin("eq");

        const result = plugin.matches({
            value,
            compareValue
        });

        expect(result).toBe(true);
    });

    const notEqualList = [
        [1, 2],
        [932, 132],
        ["some text", "some text 2"],
        [true, false],
        [false, true]
    ];
    test.each(notEqualList)("values should not be equal", (value: any, compareValue: any) => {
        const plugin = findFilterPlugin("eq");

        const result = plugin.matches({
            value,
            compareValue
        });

        expect(result).toBe(false);
    });

    const inList = [
        [1, [1, 2, 3]],
        [932, [932, "text", new Date()]],
        ["some text", ["some text", 2, true]],
        [true, [true, false, "2", 1]],
        [false, [false, "4", new Date()]]
    ];
    test.each(inList)("values should be in", (value: any, compareValue: any) => {
        const plugin = findFilterPlugin("in");

        const result = plugin.matches({
            value,
            compareValue
        });

        expect(result).toBe(true);
    });

    const notInList = [
        [1, [5, 2, 3]],
        [932, ["932", "text", new Date()]],
        ["some text", ["some text 2", 2, true]],
        [true, ["true", false, "2", 1]],
        [false, ["false", "4", new Date()]]
    ];
    test.each(notInList)("values should not be in", (value: any, compareValue: any) => {
        const plugin = findFilterPlugin("in");

        const result = plugin.matches({
            value,
            compareValue
        });

        expect(result).toBe(false);
    });

    const gtList = [
        [2, 1],
        [933, 932],
        [new Date("2021-01-02T23:23:23.000Z"), new Date("2021-01-02T23:23:22.999Z")],
        [new Date("2021-01-02T23:23:24.000Z"), new Date("2021-01-02T23:23:23.000Z")],
        [new Date("2021-01-02T23:24:23.000Z"), new Date("2021-01-02T23:23:23.000Z")],
        [new Date("2021-01-03T00:23:23.000Z"), new Date("2021-01-02T23:23:23.000Z")]
    ];
    test.each(gtList)("value should be greater", (value: any, compareValue: any) => {
        const plugin = findFilterPlugin("gt");

        const result = plugin.matches({
            value,
            compareValue
        });

        expect(result).toBe(true);
    });

    const notGtList = [
        [2, 3],
        [2, 2],
        [933, 934],
        [933, 933],
        [new Date("2021-01-02T23:23:23.000Z"), new Date("2021-01-02T23:23:23.001Z")],
        [new Date("2021-01-02T23:23:23.000Z"), new Date("2021-01-02T23:23:23.000Z")],
        [new Date("2021-01-02T23:23:24.000Z"), new Date("2021-01-02T23:24:24.000Z")],
        [new Date("2021-01-02T23:24:23.000Z"), new Date("2021-01-03T00:24:23.000Z")],
        [new Date("2021-01-03T00:23:23.000Z"), new Date("2021-01-04T00:23:23.000Z")]
    ];
    test.each(notGtList)("value should not be greater", (value: any, compareValue: any) => {
        const plugin = findFilterPlugin("gt");

        const result = plugin.matches({
            value,
            compareValue
        });

        expect(result).toBe(false);
    });

    const gteList = [
        [2, 1],
        [2, 2],
        [933, 932],
        [933, 933],
        [new Date("2021-01-02T23:23:23.000Z"), new Date("2021-01-02T23:23:22.999Z")],
        [new Date("2021-01-02T23:23:23.000Z"), new Date("2021-01-02T23:23:23.000Z")],
        [new Date("2021-01-02T23:23:24.000Z"), new Date("2021-01-02T23:23:23.000Z")],
        [new Date("2021-01-02T23:23:24.000Z"), new Date("2021-01-02T23:23:24.000Z")],
        [new Date("2021-01-02T23:24:23.000Z"), new Date("2021-01-02T23:23:23.000Z")],
        [new Date("2021-01-02T23:24:23.000Z"), new Date("2021-01-02T23:24:23.000Z")],
        [new Date("2021-01-03T00:23:23.000Z"), new Date("2021-01-02T23:23:23.000Z")],
        [new Date("2021-01-03T23:23:23.000Z"), new Date("2021-01-03T23:23:23.000Z")]
    ];
    test.each(gteList)("value should be greater or equal", (value: any, compareValue: any) => {
        const plugin = findFilterPlugin("gte");

        const result = plugin.matches({
            value,
            compareValue
        });

        expect(result).toBe(true);
    });

    const notGteList = [
        [2, 3],
        [933, 934],
        [new Date("2021-01-02T23:23:23.000Z"), new Date("2021-01-02T23:23:23.001Z")],
        [new Date("2021-01-02T23:23:23.000Z"), new Date("2021-01-02T23:23:24.000Z")],
        [new Date("2021-01-02T23:23:23.000Z"), new Date("2021-01-02T23:24:23.000Z")],
        [new Date("2021-01-02T23:23:23.000Z"), new Date("2021-01-03T00:23:23.000Z")]
    ];
    test.each(notGteList)(
        "value should not be greater or equal",
        (value: any, compareValue: any) => {
            const plugin = findFilterPlugin("gte");

            const result = plugin.matches({
                value,
                compareValue
            });

            expect(result).toBe(false);
        }
    );

    const ltList = [
        [2, 3],
        [933, 934],
        [new Date("2021-01-02T23:23:23.000Z"), new Date("2021-01-02T23:23:23.001Z")],
        [new Date("2021-01-02T23:23:24.000Z"), new Date("2021-01-02T23:23:25.000Z")],
        [new Date("2021-01-02T23:24:23.000Z"), new Date("2021-01-03T00:25:23.000Z")],
        [new Date("2021-01-03T00:23:23.000Z"), new Date("2021-01-04T00:23:24.000Z")]
    ];
    test.each(ltList)("value should be lesser", (value: any, compareValue: any) => {
        const plugin = findFilterPlugin("lt");

        const result = plugin.matches({
            value,
            compareValue
        });

        expect(result).toBe(true);
    });

    const notLtList = [
        [4, 3],
        [3, 2],
        [935, 934],
        [933, 933],
        [new Date("2021-01-02T23:23:23.000Z"), new Date("2021-01-02T23:23:23.000Z")],
        [new Date("2021-01-02T23:23:23.001Z"), new Date("2021-01-02T23:23:23.000Z")],
        [new Date("2021-01-02T23:23:24.000Z"), new Date("2021-01-02T23:23:23.000Z")],
        [new Date("2021-01-02T23:24:23.000Z"), new Date("2021-01-02T23:23:23.000Z")],
        [new Date("2021-01-03T00:23:23.000Z"), new Date("2021-01-02T23:23:23.000Z")]
    ];
    test.each(notLtList)("value should not be lesser", (value: any, compareValue: any) => {
        const plugin = findFilterPlugin("lt");

        const result = plugin.matches({
            value,
            compareValue
        });

        expect(result).toBe(false);
    });

    const lteList = [
        [2, 3],
        [2, 2],
        [933, 934],
        [933, 933],
        [new Date("2021-01-02T23:23:23.000Z"), new Date("2021-01-02T23:23:23.001Z")],
        [new Date("2021-01-02T23:23:23.000Z"), new Date("2021-01-02T23:23:23.000Z")],
        [new Date("2021-01-02T23:23:24.000Z"), new Date("2021-01-02T23:23:25.000Z")],
        [new Date("2021-01-02T23:23:24.000Z"), new Date("2021-01-02T23:23:24.000Z")],
        [new Date("2021-01-02T23:24:23.000Z"), new Date("2021-01-03T00:25:23.000Z")],
        [new Date("2021-01-02T23:24:23.000Z"), new Date("2021-01-02T23:24:23.000Z")],
        [new Date("2021-01-03T00:23:23.000Z"), new Date("2021-01-04T00:23:24.000Z")],
        [new Date("2021-01-03T00:23:23.000Z"), new Date("2021-01-03T00:23:23.000Z")]
    ];
    test.each(lteList)("value should be lesser or equal", (value: any, compareValue: any) => {
        const plugin = findFilterPlugin("lte");

        const result = plugin.matches({
            value,
            compareValue
        });

        expect(result).toBe(true);
    });

    const notLteList = [
        [4, 3],
        [935, 934],
        [new Date("2021-01-02T23:23:23.001Z"), new Date("2021-01-02T23:23:23.000Z")],
        [new Date("2021-01-02T23:23:24.000Z"), new Date("2021-01-02T23:23:23.000Z")],
        [new Date("2021-01-02T23:24:23.000Z"), new Date("2021-01-02T23:23:23.000Z")]
    ];
    test.each(notLteList)(
        "value should not be lesser or equal",
        (value: any, compareValue: any) => {
            const plugin = findFilterPlugin("lte");

            const result = plugin.matches({
                value,
                compareValue
            });

            expect(result).toBe(false);
        }
    );

    const containsList = [
        ["some text witH description", "wIth"],
        ["some texT witH description", "text wiTh"]
    ];
    test.each(containsList)("value should contain", (value: any, compareValue: any) => {
        const plugin = findFilterPlugin("contains");

        const result = plugin.matches({
            value,
            compareValue
        });

        expect(result).toBe(true);
    });

    const notContainsList = [
        ["Some text wiTh description", "with tExt"],
        ["sOme text with description", "with soMe"]
    ];
    test.each(notContainsList)("value should not contain", (value: any, compareValue: any) => {
        const plugin = findFilterPlugin("contains");

        const result = plugin.matches({
            value,
            compareValue
        });

        expect(result).toBe(false);
    });

    const startsWithList = [
        ["some text witH description", "some"],
        ["some texT witH description", "some text"]
    ];
    test.each(startsWithList)("value should startsWith", (value: any, compareValue: any) => {
        const plugin = findFilterPlugin("startsWith");

        const result = plugin.matches({
            value,
            compareValue
        });

        expect(result).toBe(true);
    });

    const notStartsWith = [
        ["Some text wiTh description", "text"],
        ["sOme text with description", "Ome text"]
    ];
    test.each(notStartsWith)("value should not startsWith", (value: any, compareValue: any) => {
        const plugin = findFilterPlugin("startsWith");

        const result = plugin.matches({
            value,
            compareValue
        });

        expect(result).toBe(false);
    });

    const betweenList = [
        [5, [4, 6]],
        [5, [4, 5]],
        [
            new Date("2021-01-02T23:23:23.000Z"),
            [new Date("2021-01-02T23:23:22.000Z"), new Date("2021-01-02T23:23:24.000Z")]
        ],
        [
            new Date("2021-01-02T23:23:23.000Z"),
            [new Date("2021-01-02T23:23:22.999Z"), new Date("2021-01-02T23:23:23.001Z")]
        ]
    ];
    test.each(betweenList)("values should be in between", (value: any, compareValue: any) => {
        const plugin = findFilterPlugin("between");

        const result = plugin.matches({
            value,
            compareValue
        });

        expect(result).toBe(true);
    });

    const notBetweenList = [
        [3, [4, 6]],
        [8, [4, 7]],
        [
            new Date("2021-01-02T23:23:22.000Z"),
            [new Date("2021-01-02T23:23:23.000Z"), new Date("2021-01-02T23:23:24.000Z")]
        ],
        [
            new Date("2021-01-02T23:23:22.998Z"),
            [new Date("2021-01-02T23:23:22.999Z"), new Date("2021-01-02T23:23:23.001Z")]
        ]
    ];
    test.each(notBetweenList)(
        "values should not be in between",
        (value: any, compareValue: any) => {
            const plugin = findFilterPlugin("between");

            const result = plugin.matches({
                value,
                compareValue
            });

            expect(result).toBe(false);
        }
    );

    test("target value should contain all required values", () => {
        const plugin = findFilterPlugin("and_in");

        const result = plugin.matches({
            value: ["news", "webiny", "local", "global"],
            compareValue: ["local", "webiny"]
        });

        expect(result).toBe(true);
    });

    test("target value does not contain all required values and match fails", () => {
        const plugin = findFilterPlugin("and_in");

        const result = plugin.matches({
            value: ["news", "local", "global"],
            compareValue: ["local", "webiny"]
        });

        expect(result).toBe(false);
    });

    const fuzzySearchList = [
        ["Crafting a good page title for SEO", "why go serverless", false],
        ["What is Serverless and is it worth it?", "why go serverless", true],
        ["Why should you go Serverless today?", "why go serverless", true],
        ["Serverless Side Rendering — The Ultimate Guide", "why go serverless", true]
    ];

    test.each(fuzzySearchList)(
        `should perform fuzzy search on "%s"`,
        (value: string, compareValue: string, expected: boolean) => {
            const plugin = findFilterPlugin("fuzzy");

            const result = plugin.matches({
                value,
                compareValue
            });

            expect(result).toBe(expected);
        }
    );

    test("must match all the given tags", () => {
        const plugin = findFilterPlugin("and_in");

        const result = plugin.matches({
            value: ["tag1", "tag2"],
            compareValue: ["tag1", "tag2"]
        });

        expect(result).toBe(true);
    });

    test("not match because not all tags are present", () => {
        const plugin = findFilterPlugin("and_in");

        const result = plugin.matches({
            value: ["tag1", "tag2"],
            compareValue: ["tag1", "tag2", "tag3"]
        });

        expect(result).toBe(false);
    });
});
