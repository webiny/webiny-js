import { describe, expect, it } from "vitest";
import { transformSortToArray } from "~/graphql/schema/cms/helpers";
import { transformWhereToNested } from "~/graphql/schema/cms/helpers";

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

        /**
         * CVE proof: second-order prototype pollution via inherited builtins.
         *
         * A fresh `{}` inherits Object.prototype methods (toString, hasOwnProperty, valueOf).
         * When the dot-notation key head matches one of these inherited names, the
         * `result[head] === undefined` guard sees a function (not undefined) and skips
         * creating a fresh own object. `nested` then becomes the real shared builtin,
         * and `Object.assign(nested, ...)` overwrites its properties process-wide.
         *
         * This is a second-order prototype pollution: no `__proto__`, `constructor`, or
         * `prototype` key is used, so classic 3-key blocklists do not catch it.
         *
         * IMPORTANT: each test must restore the corrupted builtin BEFORE calling expect(),
         * because vitest internals use Object.prototype.toString.call() and will hang/crash
         * if it's corrupted when expect() runs.
         */
        describe("second-order prototype pollution via inherited builtins", () => {
            it("should not corrupt Object.prototype.toString via 'toString.call' key", () => {
                const originalCall = Object.prototype.toString.call;

                transformWhereToNested({ "toString.call": "pwned" });

                // Capture corruption state BEFORE restoring.
                const callType = typeof Object.prototype.toString.call;

                // Restore IMMEDIATELY — before expect() triggers vitest internals.
                Object.prototype.toString.call = originalCall;

                // Now safe to assert.
                expect(callType).toBe("function");
            });

            it("should not corrupt Object.prototype.hasOwnProperty via 'hasOwnProperty.call' key", () => {
                const originalCall = Object.prototype.hasOwnProperty.call;

                transformWhereToNested({ "hasOwnProperty.call": "pwned" });

                const callType = typeof Object.prototype.hasOwnProperty.call;
                Object.prototype.hasOwnProperty.call = originalCall;

                expect(callType).toBe("function");
            });

            it("should not corrupt Object.prototype.valueOf via 'valueOf.bind' key", () => {
                const originalBind = Object.prototype.valueOf.bind;

                transformWhereToNested({ "valueOf.bind": "pwned" });

                const bindType = typeof Object.prototype.valueOf.bind;
                Object.prototype.valueOf.bind = originalBind;

                expect(bindType).toBe("function");
            });

            it("should produce correct nested output for builtin-named head keys", () => {
                const originalCall = Object.prototype.toString.call;

                const result = transformWhereToNested({ "toString.call": "x" });

                // Capture what we need before restoring.
                const hasOwnToString = Object.prototype.hasOwnProperty.call(result, "toString");
                const toStringType = typeof result!.toString;

                Object.prototype.toString.call = originalCall;

                // Result must have its own 'toString' property (a plain object, not inherited fn).
                expect(hasOwnToString).toBe(true);
                expect(toStringType).toBe("object");
            });

            it("should merge multiple dotted keys under a builtin-named head", () => {
                const result = transformWhereToNested({
                    "toString.a": 1,
                    "toString.b": 2
                });

                expect(result).toEqual({ toString: { a: 1, b: 2 } });
            });
        });

        describe("forbidden keys", () => {
            it("should throw on __proto__ as top-level key", () => {
                const input = Object.fromEntries([["__proto__", "x"]]);
                expect(() => transformWhereToNested(input)).toThrow(
                    'Invalid where key: "__proto__".'
                );
            });

            it("should throw on constructor as top-level key", () => {
                expect(() => transformWhereToNested({ constructor: "x" })).toThrow(
                    'Invalid where key: "constructor".'
                );
            });

            it("should throw on prototype as top-level key", () => {
                expect(() => transformWhereToNested({ prototype: "x" })).toThrow(
                    'Invalid where key: "prototype".'
                );
            });

            it("should throw on __proto__ as dotted head segment", () => {
                expect(() => transformWhereToNested({ "__proto__.polluted": "x" })).toThrow(
                    'Invalid where key: "__proto__".'
                );
            });

            it("should throw on constructor as dotted head segment", () => {
                expect(() => transformWhereToNested({ "constructor.polluted": "x" })).toThrow(
                    'Invalid where key: "constructor".'
                );
            });

            it("should throw on __proto__ in nested tail segment", () => {
                expect(() => transformWhereToNested({ "a.__proto__": "x" })).toThrow(
                    'Invalid where key: "__proto__".'
                );
            });

            it("should throw on constructor in deep tail segment", () => {
                expect(() => transformWhereToNested({ "a.constructor.b": "x" })).toThrow(
                    'Invalid where key: "constructor".'
                );
            });
        });
    });
});
