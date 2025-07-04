import WebinyError from "@webiny/error";
import type { ZodError } from "zod/lib/ZodError";
import { generateAlphaNumericId } from "~/generateId.js";

interface OutputError {
    code: string;
    data: Record<string, any> | null;
    message: string;
}

export interface OutputErrors {
    [key: string]: OutputError;
}

const createValidationErrorData = (error: ZodError) => {
    return {
        invalidFields: error.issues.reduce<OutputErrors>((collection, issue) => {
            const name = issue.path.join(".");
            if (!name && !issue.code) {
                return collection;
            }

            const key =
                name ||
                issue.path.join(".") ||
                issue.message ||
                issue.code ||
                generateAlphaNumericId();
            collection[key] = {
                code: issue.code,
                message: issue.message,
                data: {
                    fatal: issue.fatal,
                    path: issue.path
                }
            };

            return collection;
        }, {})
    };
};

export const createZodError = (error: ZodError) => {
    return new WebinyError({
        message: `Validation failed.`,
        code: "VALIDATION_FAILED_INVALID_FIELDS",
        data: createValidationErrorData(error)
    });
};
