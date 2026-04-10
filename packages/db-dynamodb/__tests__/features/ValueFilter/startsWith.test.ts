import { describe, expect, test } from "vitest";
import { createValueFilterRegistry } from "~tests/__mocks/registry";

describe("startsWith filter", () => {
    const registry = createValueFilterRegistry();

    const getFilter = () => {
        const filter = registry.get({
            operation: "startsWith"
        });
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

    test("canUse returns false for empty compareValue", () => {
        const filter = registry.get({ operation: "startsWith" });
        expect(filter).toBeUndefined();
    });

    test("canUse returns false for null compareValue", () => {
        const filter = registry.get({ operation: "startsWith" });
        expect(filter).toBeUndefined();
    });

    test("canUse returns false for undefined compareValue", () => {
        const filter = registry.get({
            operation: "startsWith",
        });
        expect(filter).toBeUndefined();
    });
});
