import type { ZodType, ZodError } from "zod";
import { Result } from "../Result.js";
import { ValidationError } from "../errors.js";

const formatZodError = (error: ZodError): string => {
    return error.issues
        .map(issue => {
            const path = issue.path.join(".");
            return path ? `"${path}": ${issue.message}` : issue.message;
        })
        .join("; ");
};

export const parseParams = <T>(
    schema: ZodType<T>,
    params: unknown
):
    | { ok: true; data: T }
    | { ok: false; result: ReturnType<typeof Result.fail<ValidationError>> } => {
    const parsed = schema.safeParse(params);
    if (!parsed.success) {
        return {
            ok: false,
            result: Result.fail(new ValidationError(formatZodError(parsed.error)))
        };
    }
    return { ok: true, data: parsed.data };
};
