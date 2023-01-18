import { ZodError } from "zod/lib/ZodError";

interface OutputError {
    code: string;
    data: Record<string, any> | null;
    message: string;
}

interface OutputErrors {
    [key: string]: OutputError;
}

const createValidationErrorData = (error: ZodError) => {
    return {
        invalidFields: error.issues.reduce<OutputErrors>((collection, issue) => {
            const name = issue.path.join(".");
            if (!name) {
                return collection;
            }
            collection[name] = {
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

interface ErrorOutput {
    message: string;
    code: string;
    data: any;
}

export const createZodError = (error: ZodError): ErrorOutput => {
    return {
        message: `Validation failed.`,
        code: "VALIDATION_FAILED_INVALID_FIELDS",
        data: createValidationErrorData(error)
    };
};
