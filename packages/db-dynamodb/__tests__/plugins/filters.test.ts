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

        const plugin = byType.find(plugin => plugin.operation === operation);
        if (plugin) {
            return plugin;
        }
        throw new Error(`Filter plugin "${operation}" not found.`);
    };

    test.each(operations)("has the filter plugin registered - %s", (operation: string) => {
        const exists = findFilterPlugin(operation) !== undefined;

        expect(exists).toBe(true);
    });

    const equalList: ([number, number] | [string, string] | [boolean, boolean])[] = [
        [1, 1],
        [932, 932],
        ["some text", "some text"],
        [true, true],
        [false, false]
    ];
    test.each(equalList)("values should be equal", (value, compareValue) => {
        const plugin = findFilterPlugin("eq");

        const result = plugin.matches({
            value,
            compareValue
        });

        expect(result).toBe(true);
    });

    const notEqualList: ([number, number] | [string, string] | [boolean, boolean])[] = [
        [1, 2],
        [932, 132],
        ["some text", "some text 2"],
        [true, false],
        [false, true]
    ];
    test.each(notEqualList)("values should not be equal", (value, compareValue) => {
        const plugin = findFilterPlugin("eq");

        const result = plugin.matches({
            value,
            compareValue
        });

        expect(result).toBe(false);
    });

    const inList: [
        [number, [number, number, number]],
        [number, [number, string, Date]],
        [string, [string, number, boolean]],
        [boolean, [boolean, boolean, string, number]],
        [boolean, [boolean, string, Date]]
    ] = [
        [1, [1, 2, 3]],
        [932, [932, "text", new Date()]],
        ["some text", ["some text", 2, true]],
        [true, [true, false, "2", 1]],
        [false, [false, "4", new Date()]]
    ];
    test.each(inList)("values should be in", (value, compareValue) => {
        const plugin = findFilterPlugin("in");

        const result = plugin.matches({
            value,
            compareValue
        });

        expect(result).toBe(true);
    });

    const notInList: [
        [number, [number, number, number]],
        [number, [string, string, Date]],
        [string, [string, number, boolean]],
        [boolean, [string, boolean, string, number]],
        [boolean, [string, string, Date]]
    ] = [
        [1, [5, 2, 3]],
        [932, ["932", "text", new Date()]],
        ["some text", ["some text 2", 2, true]],
        [true, ["true", false, "2", 1]],
        [false, ["false", "4", new Date()]]
    ];
    test.each(notInList)("values should not be in", (value, compareValue) => {
        const plugin = findFilterPlugin("in");

        const result = plugin.matches({
            value,
            compareValue
        });

        expect(result).toBe(false);
    });

    const gtList: ([number, number] | [Date, Date])[] = [
        [2, 1],
        [933, 932],
        [new Date("2021-01-02T23:23:23.000Z"), new Date("2021-01-02T23:23:22.999Z")],
        [new Date("2021-01-02T23:23:24.000Z"), new Date("2021-01-02T23:23:23.000Z")],
        [new Date("2021-01-02T23:24:23.000Z"), new Date("2021-01-02T23:23:23.000Z")],
        [new Date("2021-01-03T00:23:23.000Z"), new Date("2021-01-02T23:23:23.000Z")]
    ];
    test.each(gtList)("value should be greater", (value, compareValue) => {
        const plugin = findFilterPlugin("gt");

        const result = plugin.matches({
            value,
            compareValue
        });

        expect(result).toBe(true);
    });

    const notGtList: ([number, number] | [Date, Date])[] = [
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
    test.each(notGtList)("value should not be greater", (value, compareValue) => {
        const plugin = findFilterPlugin("gt");

        const result = plugin.matches({
            value,
            compareValue
        });

        expect(result).toBe(false);
    });

    const gteList: ([number, number] | [Date, Date])[] = [
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
    test.each(gteList)("value should be greater or equal", (value, compareValue) => {
        const plugin = findFilterPlugin("gte");

        const result = plugin.matches({
            value,
            compareValue
        });

        expect(result).toBe(true);
    });

    const notGteList: ([number, number] | [Date, Date])[] = [
        [2, 3],
        [933, 934],
        [new Date("2021-01-02T23:23:23.000Z"), new Date("2021-01-02T23:23:23.001Z")],
        [new Date("2021-01-02T23:23:23.000Z"), new Date("2021-01-02T23:23:24.000Z")],
        [new Date("2021-01-02T23:23:23.000Z"), new Date("2021-01-02T23:24:23.000Z")],
        [new Date("2021-01-02T23:23:23.000Z"), new Date("2021-01-03T00:23:23.000Z")]
    ];
    test.each(notGteList)("value should not be greater or equal", (value, compareValue) => {
        const plugin = findFilterPlugin("gte");

        const result = plugin.matches({
            value,
            compareValue
        });

        expect(result).toBe(false);
    });

    const ltList: ([number, number] | [Date, Date])[] = [
        [2, 3],
        [933, 934],
        [new Date("2021-01-02T23:23:23.000Z"), new Date("2021-01-02T23:23:23.001Z")],
        [new Date("2021-01-02T23:23:24.000Z"), new Date("2021-01-02T23:23:25.000Z")],
        [new Date("2021-01-02T23:24:23.000Z"), new Date("2021-01-03T00:25:23.000Z")],
        [new Date("2021-01-03T00:23:23.000Z"), new Date("2021-01-04T00:23:24.000Z")]
    ];
    test.each(ltList)("value should be lesser", (value, compareValue) => {
        const plugin = findFilterPlugin("lt");

        const result = plugin.matches({
            value,
            compareValue
        });

        expect(result).toBe(true);
    });

    const notLtList: ([number, number] | [Date, Date])[] = [
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
    test.each(notLtList)("value should not be lesser", (value, compareValue) => {
        const plugin = findFilterPlugin("lt");

        const result = plugin.matches({
            value,
            compareValue
        });

        expect(result).toBe(false);
    });

    const lteList: ([number, number] | [Date, Date])[] = [
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
    test.each(lteList)("value should be lesser or equal", (value, compareValue) => {
        const plugin = findFilterPlugin("lte");

        const result = plugin.matches({
            value,
            compareValue
        });

        expect(result).toBe(true);
    });

    const notLteList: ([number, number] | [Date, Date])[] = [
        [4, 3],
        [935, 934],
        [new Date("2021-01-02T23:23:23.001Z"), new Date("2021-01-02T23:23:23.000Z")],
        [new Date("2021-01-02T23:23:24.000Z"), new Date("2021-01-02T23:23:23.000Z")],
        [new Date("2021-01-02T23:24:23.000Z"), new Date("2021-01-02T23:23:23.000Z")]
    ];
    test.each(notLteList)("value should not be lesser or equal", (value, compareValue) => {
        const plugin = findFilterPlugin("lte");

        const result = plugin.matches({
            value,
            compareValue
        });

        expect(result).toBe(false);
    });

    const containsList = [
        ["some text witH description", "wIth"],
        ["some texT witH description", "text wiTh"]
    ];
    test.each(containsList)("value should contain", (value, compareValue) => {
        const plugin = findFilterPlugin("contains");

        const result = plugin.matches({
            value,
            compareValue
        });

        expect(result).toBe(true);
    });

    const notContainsList = [
        ["Some text wiTh description", "with tExta"],
        ["sOme text with description", "with soMeE"]
    ];
    test.each(notContainsList)("value should not contain", (value, compareValue) => {
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
    test.each(startsWithList)("value should startsWith", (value, compareValue) => {
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
    test.each(notStartsWith)("value should not startsWith", (value, compareValue) => {
        const plugin = findFilterPlugin("startsWith");

        const result = plugin.matches({
            value,
            compareValue
        });

        expect(result).toBe(false);
    });

    const betweenList: [
        [number, [number, number]],
        [number, [number, number]],
        [Date, [Date, Date]],
        [Date, [Date, Date]]
    ] = [
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
    test.each(betweenList)("values should be in between", (value, compareValue) => {
        const plugin = findFilterPlugin("between");

        const result = plugin.matches({
            value,
            compareValue
        });

        expect(result).toBe(true);
    });

    const notBetweenList: [
        [number, [number, number]],
        [number, [number, number]],
        [Date, [Date, Date]],
        [Date, [Date, Date]]
    ] = [
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
    test.each(notBetweenList)("values should not be in between", (value, compareValue) => {
        const plugin = findFilterPlugin("between");

        const result = plugin.matches({
            value,
            compareValue
        });

        expect(result).toBe(false);
    });

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

    const fuzzySearchList: [string, string, boolean][] = [
        ["Crafting a good page title for SEO", "why go serverless", false],
        ["What is Serverless and is it worth it?", "why go serverless", true],
        ["Why should you go Serverless today?", "why go serverless", true],
        ["Serverless Side Rendering — The Ultimate Guide", "why go serverless", true]
    ];

    test.each(fuzzySearchList)(
        `should perform fuzzy search on "%s"`,
        (value, compareValue, expected) => {
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
