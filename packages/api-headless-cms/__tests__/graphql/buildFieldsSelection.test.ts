import { describe, expect, it } from "vitest";
import { buildFieldsSelection } from "~/graphql/schema/cms/helpers/buildFieldsSelection.js";

const normalize = (value: string) => value.replace(/\s+/g, " ").trim();

describe("buildFieldsSelection", () => {
    it("should build a nested selection from field paths", () => {
        const selection = buildFieldsSelection([
            "id",
            "values.title",
            "values.author.name",
            "values.author.email"
        ]);

        expect(normalize(selection)).toBe(
            normalize(`
                id
                values {
                    author {
                        email
                        name
                    }
                    title
                }
            `)
        );
    });

    it("should return the default selection when no fields are given", () => {
        expect(normalize(buildFieldsSelection([]))).toBe("id entryId values");
        expect(normalize(buildFieldsSelection())).toBe("id entryId values");
    });

    it("should reject field paths that are not plain GraphQL names", () => {
        const invalid = [
            "id } } other: getSomething { data { id",
            "values.title { id }",
            "values..title",
            "values.",
            "",
            "1abc",
            "values.na-me",
            "...on Article"
        ];

        for (const field of invalid) {
            expect(() => buildFieldsSelection(["id", field])).toThrow(`Invalid field "${field}".`);
        }
    });

    it("should never modify Object.prototype", () => {
        const fields = [
            "__proto__.pollutedA",
            "__proto__.pollutedB.inner",
            "constructor.prototype.pollutedC",
            "values.__proto__.pollutedD",
            "values.constructor.prototype.pollutedE.inner"
        ];

        for (const field of fields) {
            buildFieldsSelection([field]);
        }

        const probe: Record<string, unknown> = {};
        for (const key of ["pollutedA", "pollutedB", "pollutedC", "pollutedD", "pollutedE"]) {
            expect(probe[key]).toBeUndefined();
            expect(key in probe).toBe(false);
        }
        expect(Object.keys(Object.prototype)).toEqual([]);
    });
});
