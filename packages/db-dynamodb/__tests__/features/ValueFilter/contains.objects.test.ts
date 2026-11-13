import { describe, test, expect } from "vitest";
import { createValueFilterRegistry } from "~tests/__mocks/registry";

/**
 * Values of searchable-json fields are objects. When those fields live inside a multiple values object field,
 * the value is an array of objects. The contains filter must search through the object values in both cases.
 */
describe("contains filter - objects", () => {
    const registry = createValueFilterRegistry();

    const getFilter = () => {
        const filter = registry.get("contains");
        if (!filter) {
            throw new Error(`Missing "contains" filter.`);
        }
        return filter;
    };

    const object = {
        pattern: "Striped",
        stock: 10,
        available: true,
        origin: {
            country: "Portugal",
            tags: ["cotton", "handmade"]
        }
    };

    const containsList: [string, unknown, string][] = [
        ["object", object, "striped"],
        ["object - nested value", object, "portugal"],
        ["object - nested array value", object, "handmade"],
        ["array of objects", [object], "striped"],
        ["array of objects - nested value", [object], "portugal"],
        ["array of objects - nested array value", [object], "handmade"],
        ["array of objects - second item", [{ pattern: "Checkered" }, object], "striped"],
        ["nested array of objects", [[object]], "portugal"],
        ["array of strings", ["cotton", "handmade"], "made"]
    ];
    test.each(containsList)("value should contain - %s", (_, value, compareValue) => {
        const filter = getFilter();

        const result = filter.matches({ value, compareValue });

        expect(result).toBe(true);
    });

    const notContainsList: [string, unknown, string][] = [
        ["object", object, "checkered"],
        ["array of objects", [object], "checkered"],
        ["array of objects - no match for object string representation", [object], "object"],
        ["array of strings", ["cotton", "handmade"], "wool"]
    ];
    test.each(notContainsList)("value should not contain - %s", (_, value, compareValue) => {
        const filter = getFilter();

        const result = filter.matches({ value, compareValue });

        expect(result).toBe(false);
    });
});
