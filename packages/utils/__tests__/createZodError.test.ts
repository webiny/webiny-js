import { describe, it, expect } from "vitest";
import zod from "zod";
import { createZodError } from "~/createZodError.js";

describe("create zod error", () => {
    const validation = zod.object({
        name: zod.string().min(1),
        description: zod.string().min(1),
        price: zod.number().max(100)
    });

    it("should properly create zod error", async () => {
        const input: zod.infer<typeof validation> = {
            /**
             * The `undefined` cannot be sent to name, but we want to test that the error is properly created.
             * Error is expected.
             */
            // @ts-expect-error
            name: undefined,
            description: "",
            price: 101
        };

        const validationResult = await validation.safeParseAsync(input);

        expect(validationResult.success).toEqual(false);
        if (validationResult.success) {
            throw new Error("Should not happen.");
        }

        const result = createZodError(validationResult.error);

        expect(result).toMatchObject({
            message: `Validation failed.`,
            code: "VALIDATION_FAILED_INVALID_FIELDS",
            data: {
                invalidFields: {
                    name: {
                        code: "invalid_type",
                        message: "Invalid input: expected string, received undefined",
                        data: {
                            path: ["name"]
                        }
                    },
                    description: {
                        code: "too_small",
                        message: "Too small: expected string to have >=1 characters",
                        data: {
                            path: ["description"]
                        }
                    },
                    price: {
                        code: "too_big",
                        message: "Too big: expected number to be <=100",
                        data: {
                            path: ["price"]
                        }
                    }
                }
            }
        });
    });
});
