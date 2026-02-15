import { describe, expect, it } from "vitest";
import { transformSortToArray } from "~/graphql/schema/cms/helpers";

/**
 * Test the sort transformation helper that converts object format to array format.
 * This transformation is needed because the CMS schema accepts sort as an object,
 * but the underlying GraphQL schemas expect an array format.
 */
describe("CMS Schema Helpers", () => {
    describe("transformSortToArray", () => {
        it("should transform single sort field from object to array", () => {
            const input = { createdOn: "desc" };
            const expected = [{ createdOn: "DESC" }];

            const result = transformSortToArray(input);

            expect(result).toEqual(expected);
        });

        it("should transform multiple sort fields from object to array", () => {
            const input = { createdOn: "desc", name: "asc" };
            const expected = [{ createdOn: "DESC" }, { name: "ASC" }];

            const result = transformSortToArray(input);

            expect(result).toEqual(expected);
        });

        it("should handle uppercase direction values", () => {
            const input = { createdOn: "DESC" };
            const expected = [{ createdOn: "DESC" }];

            const result = transformSortToArray(input);

            expect(result).toEqual(expected);
        });

        it("should handle lowercase direction values", () => {
            const input = { modifiedOn: "asc" };
            const expected = [{ modifiedOn: "ASC" }];

            const result = transformSortToArray(input);

            expect(result).toEqual(expected);
        });

        it("should return undefined for undefined input", () => {
            const result = transformSortToArray(undefined);

            expect(result).toBeUndefined();
        });

        it("should return undefined for null input", () => {
            const result = transformSortToArray(null as any);

            expect(result).toBeUndefined();
        });

        it("should return empty array for empty object", () => {
            const result = transformSortToArray({});

            expect(result).toEqual([]);
        });
    });
});
