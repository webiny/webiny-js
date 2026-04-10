import { describe, test, expect } from "vitest";
import { createValueFilterRegistry } from "~tests/__mocks/registry";

describe("fuzzy filter", () => {
    const registry = createValueFilterRegistry();

    const getFilter = () => {
        const filter = registry.get({ operation: "fuzzy" });
        expect(filter).toBeDefined();
        return filter!;
    };

    const fuzzySearchList: [string, string, boolean][] = [
        ["Crafting a good page title for SEO", "why go serverless", false],
        ["What is Serverless and is it worth it?", "why go serverless", true],
        ["Why should you go Serverless today?", "why go serverless", true],
        ["Serverless Side Rendering — The Ultimate Guide", "why go serverless", true]
    ];

    test.each(fuzzySearchList)(
        `should perform fuzzy search on "%s"`,
        (value, compareValue, expected) => {
            const filter = getFilter();

            const result = filter.matches({ value, compareValue });

            expect(result).toBe(expected);
        }
    );
});
