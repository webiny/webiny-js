import { createRequestBody } from "~/createRequestBody.js";
import { HttpClientError } from "@webiny/event-handler-core";
import { describe, it, expect } from "vitest";

describe("createRequestBody", () => {
    it("should accept a valid GraphQL request body", () => {
        const input = Object.freeze({
            query: "query TestQuery { test }",
            variables: { id: "123" },
            operationName: "TestQuery"
        });
        const result = createRequestBody(input);
        expect(result).toEqual(input);
    });

    it("should accept a batch of GraphQL requests", () => {
        const input = [{ query: "{ a }" }, { query: "{ b }" }];
        expect(createRequestBody(input)).toEqual(input);
    });

    it.each([
        ["a stringified request", JSON.stringify({ query: "{ test }" })],
        ["malformed JSON", "{ not json"],
        ["a string with a __proto__ key", '{"query":"{ test }","__proto__":{"polluted":true}}']
    ])("should refuse %s with a 400 GRAPHQL_REQUEST_INVALID", (_, input) => {
        expect(() => createRequestBody(input)).toThrow(HttpClientError);
        expect(() => createRequestBody(input)).toThrow(
            expect.objectContaining({ statusCode: 400, code: "GRAPHQL_REQUEST_INVALID" })
        );
        expect(({} as Record<string, unknown>)["polluted"]).toBeUndefined();
    });

    it("should refuse a body without a query with a 400 GRAPHQL_REQUEST_INVALID", () => {
        expect(() => createRequestBody({ notAQuery: true })).toThrow(
            expect.objectContaining({ statusCode: 400, code: "GRAPHQL_REQUEST_INVALID" })
        );
    });
});
