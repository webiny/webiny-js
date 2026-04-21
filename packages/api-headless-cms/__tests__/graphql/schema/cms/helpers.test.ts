import { describe, expect, it } from "vitest";
import { transformSortToArray } from "~/graphql/schema/cms/helpers";
import { transformWhereToNested } from "~/graphql/schema/cms/helpers";
import { transformFieldErrors } from "~/graphql/schema/cms/helpers";

/**
 * Test the sort transformation helper that converts object format to array format.
 * This transformation is needed because the CMS schema accepts sort as an object,
 * but the underlying GraphQL schemas expect an array format.
 */
describe("CMS Schema Helpers", () => {
    describe("transformSortToArray", () => {
        it("should transform single sort field from object to array", () => {
            const input = { createdOn: "desc" };
            const expected = ["createdOn_DESC"];

            const result = transformSortToArray(input);

            expect(result).toEqual(expected);
        });

        it("should transform multiple sort fields from object to array", () => {
            const input = { createdOn: "desc", name: "asc" };
            const expected = ["createdOn_DESC", "name_ASC"];

            const result = transformSortToArray(input);

            expect(result).toEqual(expected);
        });

        it("should handle uppercase direction values", () => {
            const input = { createdOn: "DESC" };
            const expected = ["createdOn_DESC"];

            const result = transformSortToArray(input);

            expect(result).toEqual(expected);
        });

        it("should handle lowercase direction values", () => {
            const input = { modifiedOn: "asc" };
            const expected = ["modifiedOn_ASC"];

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

    describe("transformWhereToNested", () => {
        it("should return undefined for undefined input", () => {
            expect(transformWhereToNested(undefined)).toBeUndefined();
        });

        it("should pass through top-level keys unchanged", () => {
            const input = { id: "abc#0001", entryId: "abc" };
            expect(transformWhereToNested(input)).toEqual({ id: "abc#0001", entryId: "abc" });
        });

        it("should expand dot-notation key into nested object", () => {
            const input = { "values.name": "Keyboard" };
            expect(transformWhereToNested(input)).toEqual({ values: { name: "Keyboard" } });
        });

        it("should merge multiple dot-notation keys under the same parent", () => {
            const input = { "values.name": "Keyboard", "values.price": 150 };
            expect(transformWhereToNested(input)).toEqual({
                values: { name: "Keyboard", price: 150 }
            });
        });

        it("should handle a mix of top-level and dot-notation keys", () => {
            const input = { id: "abc#0001", "values.name": "Keyboard" };
            expect(transformWhereToNested(input)).toEqual({
                id: "abc#0001",
                values: { name: "Keyboard" }
            });
        });

        it("should handle multi-level dot-notation keys", () => {
            const input = { "values.author.name": "John" };
            expect(transformWhereToNested(input)).toEqual({
                values: { author: { name: "John" } }
            });
        });

        it("should handle filter operators with dot-notation (e.g. values.name_contains)", () => {
            const input = { "values.name_contains": "board" };
            expect(transformWhereToNested(input)).toEqual({
                values: { name_contains: "board" }
            });
        });

        it("should recursively transform AND/OR arrays", () => {
            const input = {
                AND: [{ "values.name": "Keyboard" }, { "values.price": 150 }]
            };
            expect(transformWhereToNested(input)).toEqual({
                AND: [{ values: { name: "Keyboard" } }, { values: { price: 150 } }]
            });
        });
    });

    describe("transformFieldErrors", () => {
        it("should rewrite unknown-field error using the matching user-supplied path", () => {
            const errors = [
                { message: 'Cannot query field "nonExistentField" on type "ProductValues".' }
            ];
            const fields = ["id", "values.nonExistentField"];

            const result = transformFieldErrors(errors, fields);

            expect(result).toBe(
                'Unknown field: "values.nonExistentField" — "nonExistentField" does not exist.'
            );
        });

        it("should rewrite object-as-leaf error using the matching user-supplied path", () => {
            const errors = [
                {
                    message:
                        'Field "category" of type "RefCategory" must have a selection of subfields. Did you mean "category { ... }"?'
                }
            ];
            const fields = ["id", "values.category"];

            const result = transformFieldErrors(errors, fields);

            expect(result).toBe(
                'Field "values.category" is an object type and requires sub-field selection.'
            );
        });

        it("should join multiple transformed errors with a semicolon", () => {
            const errors = [
                { message: 'Cannot query field "badField" on type "ProductValues".' },
                { message: 'Cannot query field "anotherBad" on type "ProductValues".' }
            ];
            const fields = ["values.badField", "values.anotherBad"];

            const result = transformFieldErrors(errors, fields);

            expect(result).toBe(
                'Unknown field: "values.badField" — "badField" does not exist.; Unknown field: "values.anotherBad" — "anotherBad" does not exist.'
            );
        });

        it("should return the original message when no field path matches", () => {
            const errors = [
                { message: 'Cannot query field "mystery" on type "ProductValues".' }
            ];
            const fields = ["id", "values.name"];

            const result = transformFieldErrors(errors, fields);

            expect(result).toBe('Cannot query field "mystery" on type "ProductValues".');
        });

        it("should return the original message for unrecognised error patterns", () => {
            const errors = [{ message: "Some unexpected error from the server." }];
            const fields = ["id", "values.name"];

            const result = transformFieldErrors(errors, fields);

            expect(result).toBe("Some unexpected error from the server.");
        });
    });
});
