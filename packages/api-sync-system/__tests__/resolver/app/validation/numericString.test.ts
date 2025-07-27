import { createNumericStringValidation } from "~/resolver/app/validation/numericString";
import { createZodError } from "@webiny/utils";

describe("validate numericString", () => {
    it("should parse valid numeric strings", async () => {
        const validation = createNumericStringValidation("Test");

        const result = await validation.safeParseAsync("12345");

        expect(result.success).toBeTrue();
        expect(result.data).toBe("12345");
    });

    it("should fail to parse invalid numeric strings", async () => {
        const validation = createNumericStringValidation("Test");

        const result = await validation.safeParseAsync("12345abc"); // Invalid numeric string

        expect(result.success).toBeFalse();
        expect(result.error).toBeDefined();
        expect(result.data).toBeUndefined();

        // @ts-expect-error
        const error = createZodError(result.error);

        expect(error.message).toEqual("Validation failed.");
        expect(error.data).toEqual({
            invalidFields: {
                '"Test" must be a numeric string.': {
                    code: "custom",
                    data: {
                        fatal: undefined,
                        path: []
                    },
                    message: '"Test" must be a numeric string.'
                }
            }
        });
    });
});
