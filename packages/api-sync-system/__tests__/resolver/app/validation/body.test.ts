import { describe, expect, it } from "vitest";
import { createBodyValidation } from "~/resolver/app/validation/body.js";
import { convertException, createZodError } from "@webiny/utils";

describe("validate body", () => {
    it("should fail validation", async () => {
        const validation = createBodyValidation();

        const result = await validation.safeParseAsync({
            version: "1",
            id: "id",
            "detail-type": "test",
            source: "test",
            account: "123456789012",
            time: new Date().toISOString(),
            region: "us-east-1",
            resources: [],
            detail: {}
        });

        expect(result.success).toBeFalse();
        expect(result.error).toBeDefined();
        expect(result.data).toBeUndefined();

        // @ts-expect-error
        const error = createZodError(result.error);
        const exception = convertException(error);
        expect(exception.data).toEqual({
            invalidFields: {
                "detail-type": {
                    code: "custom",
                    data: {
                        path: ["detail-type"]
                    },
                    message: '"detail-type" must be "synchronization-input".'
                },
                "detail.id": {
                    code: "invalid_type",
                    data: {
                        path: ["detail", "id"]
                    },
                    message: "Invalid input: expected string, received undefined"
                },
                "detail.items": {
                    code: "invalid_type",
                    data: {
                        path: ["detail", "items"]
                    },
                    message: "Invalid input: expected array, received undefined"
                },
                "detail.source": {
                    code: "invalid_type",
                    data: {
                        path: ["detail", "source"]
                    },
                    message: "Invalid input: expected object, received undefined"
                },
                source: {
                    code: "custom",
                    data: {
                        path: ["source"]
                    },
                    message: '"source" must start with "webiny:".'
                }
            }
        });
    });
});
