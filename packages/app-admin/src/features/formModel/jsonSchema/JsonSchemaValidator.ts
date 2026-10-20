import type { JsonSchemaValidationResult } from "./JsonSchemaValidationResult.js";

export interface JsonSchemaValidator {
    validate(value: unknown): JsonSchemaValidationResult;
}
