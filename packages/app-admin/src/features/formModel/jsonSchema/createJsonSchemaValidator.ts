import { z } from "zod";
import type { JsonSchema } from "./JsonSchema.js";

export interface JsonSchemaIssue {
    path: string;
    message: string;
}

export interface JsonSchemaValidationResult {
    valid: boolean;
    issues: JsonSchemaIssue[];
}

export interface JsonSchemaValidator {
    validate(value: unknown): JsonSchemaValidationResult;
}

const VALID: JsonSchemaValidationResult = { valid: true, issues: [] };

const buildZodSchema = (schema: JsonSchema): z.ZodType | null => {
    try {
        return z.fromJSONSchema(schema);
    } catch {
        // `z.fromJSONSchema` throws for a schema it cannot build (an unknown type, a missing $ref).
        return null;
    }
};

/*
 * Rebuilds the schema's validator with `z.fromJSONSchema` (R271). It never throws: a schema zod
 * cannot build gives a validator that reports every value as valid. An issue's `path` is the
 * dot-joined zod path (empty for the value itself), like the server's settings issues.
 */
export const createJsonSchemaValidator = (schema: JsonSchema): JsonSchemaValidator => {
    const zodSchema = buildZodSchema(schema);

    return {
        validate(value: unknown): JsonSchemaValidationResult {
            if (!zodSchema) {
                return VALID;
            }
            try {
                const result = zodSchema.safeParse(value);
                if (result.success) {
                    return VALID;
                }
                const issues = result.error.issues.map(issue => {
                    const path = issue.path.map(String).join(".");
                    return { path, message: issue.message };
                });
                return { valid: false, issues };
            } catch {
                return VALID;
            }
        }
    };
};
