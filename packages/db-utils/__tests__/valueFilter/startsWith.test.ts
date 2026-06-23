import { describe, expect, test } from "vitest";
import { createValueFilterRegistry } from "./__mocks/registry";

describe("startsWith filter", () => {
    const registry = createValueFilterRegistry();

    const getFilter = () => {
        const filter = registry.get("startsWith");
        expect(filter).toBeDefined();
        return filter!;
    };

    const startsWithList = [
        ["some text witH description", "some"],
        ["some texT witH description", "some text"]
    ];
    test.each(startsWithList)(
        "value should startsWith - %s starts with %s",
        (value, compareValue) => {
            const filter = getFilter();

            const result = filter.matches({ value, compareValue });

            expect(result).toBe(true);
        }
    );

    const notStartsWith = [
        ["Some text wiTh description", "text"],
        ["sOme text with description", "Ome text"]
    ];
    test.each(notStartsWith)(
        "value should not startsWith - %s does not start with %s",
        (value, compareValue) => {
            const filter = getFilter();

            const result = filter.matches({ value, compareValue });

            expect(result).toBe(false);
        }
    );

    test("matches returns true for null value and null compareValue", () => {
        const filter = getFilter();

        const result = filter.matches({ value: null, compareValue: null });

        expect(result).toBe(true);
    });

    test("matches returns true for undefined value and undefined compareValue", () => {
        const filter = getFilter();

        const result = filter.matches({ value: undefined, compareValue: undefined });

        expect(result).toBe(true);
    });
});
