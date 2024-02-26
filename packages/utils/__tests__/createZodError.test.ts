import zod from "zod";
import { createZodError } from "~/createZodError";

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
                        message: "Required",
                        data: {
                            path: ["name"]
                        }
                    },
                    description: {
                        code: "too_small",
                        message: "String must contain at least 1 character(s)",
                        data: {
                            path: ["description"]
                        }
                    },
                    price: {
                        code: "too_big",
                        message: "Number must be less than or equal to 100",
                        data: {
                            path: ["price"]
                        }
                    }
                }
            }
        });
    });
});
