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
});
