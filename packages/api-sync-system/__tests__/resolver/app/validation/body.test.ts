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
                        fatal: undefined,
                        path: ["detail-type"]
                    },
                    message: '"detail-type" must be "synchronization-input".'
                },
                "detail.id": {
                    code: "invalid_type",
                    data: {
                        fatal: undefined,
                        path: ["detail", "id"]
                    },
                    message: "Required"
                },
                "detail.items": {
                    code: "invalid_type",
                    data: {
                        fatal: undefined,
                        path: ["detail", "items"]
                    },
                    message: "Required"
                },
                "detail.source": {
                    code: "invalid_type",
                    data: {
                        fatal: undefined,
                        path: ["detail", "source"]
                    },
                    message: "Required"
                },
                source: {
                    code: "custom",
                    data: {
                        fatal: undefined,
                        path: ["source"]
                    },
                    message: '"source" must start with "webiny:".'
                }
            }
        });
    });
});
