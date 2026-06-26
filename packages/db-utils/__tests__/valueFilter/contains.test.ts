import { describe, test, expect } from "vitest";
import { createValueFilterRegistry } from "./__mocks/registry";

describe("contains filter", () => {
    const registry = createValueFilterRegistry();

    const getFilter = () => {
        const filter = registry.get("contains");
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

    const regexMetacharsList = [
        ["some (text) with [brackets]", "(text)"],
        ["price is $100.00", "$100.00"],
        ["path/to/file.txt", "file.txt"],
        ["hello.*world", ".*world"],
        ["a+b=c", "a+b"]
    ];
    test.each(regexMetacharsList)(
        "should match literal metacharacters - %s contains %s",
        (value, compareValue) => {
            const filter = getFilter();

            const result = filter.matches({ value, compareValue });

            expect(result).toBe(true);
        }
    );

    const emptyCompareList = [
        ["some text", ""],
        ["some text", " "],
        ["some text", ":::"],
        ["some text", ": : :"]
    ];
    test.each(emptyCompareList)(
        "should not match when compareValue is empty after normalization - %s vs %s",
        (value, compareValue) => {
            const filter = getFilter();

            const result = filter.matches({ value, compareValue });

            expect(result).toBe(false);
        }
    );

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
