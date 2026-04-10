import { describe, test, expect } from "vitest";
import { createValueFilterRegistry } from "~tests/__mocks/registry";

describe("and_in filter", () => {
    const registry = createValueFilterRegistry();

    const getFilter = () => {
        const filter = registry.get("and_in");
        expect(filter).toBeDefined();
        return filter!;
    };

    test("target value should contain all required values", () => {
        const filter = getFilter();

        const result = filter.matches({
            value: ["news", "webiny", "local", "global"],
            compareValue: ["local", "webiny"]
        });

        expect(result).toBe(true);
    });

    test("target value does not contain all required values and match fails", () => {
        const filter = getFilter();

        const result = filter.matches({
            value: ["news", "local", "global"],
            compareValue: ["local", "webiny"]
        });

        expect(result).toBe(false);
    });

    test("must match all the given tags", () => {
        const filter = getFilter();

        const result = filter.matches({
            value: ["tag1", "tag2"],
            compareValue: ["tag1", "tag2"]
        });

        expect(result).toBe(true);
    });

    test("not match because not all tags are present", () => {
        const filter = getFilter();

        const result = filter.matches({
            value: ["tag1", "tag2"],
            compareValue: ["tag1", "tag2", "tag3"]
        });

        expect(result).toBe(false);
    });
});
