import { describe, test, expect } from "vitest";
import { createValueFilterRegistry } from "~tests/__mocks/registry";

describe("contains filter", () => {
    const registry = createValueFilterRegistry();

    const getFilter = () => {
        const filter = registry.get({ operation: "contains" });
        expect(filter).toBeDefined();
        return filter!;
    };

    const containsList = [
        ["some text witH description", "wIth"],
        ["some texT witH description", "text wiTh"]
    ];
    test.each(containsList)("value should contain - %s contains %s", (value, compareValue) => {
        const filter = getFilter();

        const result = filter.matches({ value, compareValue });

        expect(result).toBe(true);
    });

    const notContainsList = [
        ["Some text wiTh description", "with tExta"],
        ["sOme text with description", "with soMeE"]
    ];
    test.each(notContainsList)(
        "value should not contain - %s not contains %s",
        (value, compareValue) => {
            const filter = getFilter();

            const result = filter.matches({ value, compareValue });

            expect(result).toBe(false);
        }
    );
});
