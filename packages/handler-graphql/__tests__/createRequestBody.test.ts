import { createRequestBody } from "~/createRequestBody.js";
import { describe, it, expect } from "vitest";

describe("createRequestBody", () => {
    it("should parse a valid GraphQL request body", () => {
        const input = Object.freeze({
            query: "query TestQuery { test }",
            variables: { id: "123" },
            operationName: "TestQuery"
        });
        const stringifiedInputResult = createRequestBody(JSON.stringify(input));
        expect(stringifiedInputResult).toEqual(input);
        const objectInputResult = createRequestBody(input);
        expect(objectInputResult).toEqual(input);
    });

    it.each([
        ["a top-level __proto__ key", '{"query":"{ test }","__proto__":{"polluted":true}}'],
        [
            "a __proto__ key in variables",
            '{"query":"{ test }","variables":{"__proto__":{"polluted":true}}}'
        ],
        [
            "a constructor.prototype key",
            '{"query":"{ test }","variables":{"constructor":{"prototype":{"polluted":true}}}}'
        ]
    ])("should reject a string body with %s", (_, input) => {
        expect(() => createRequestBody(input)).toThrow(
            expect.objectContaining({ code: "GRAPHQL_REQUEST_INVALID" })
        );
        expect(({} as Record<string, unknown>)["polluted"]).toBeUndefined();
    });

    it("should reject a malformed string body with GRAPHQL_REQUEST_INVALID", () => {
        expect(() => createRequestBody("{ not json")).toThrow(
            expect.objectContaining({ code: "GRAPHQL_REQUEST_INVALID" })
        );
    });
});
