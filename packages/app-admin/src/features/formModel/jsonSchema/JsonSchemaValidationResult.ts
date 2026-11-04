import type { JsonSchemaIssue } from "./JsonSchemaIssue.js";

export interface JsonSchemaValidationResult {
    valid: boolean;
    issues: JsonSchemaIssue[];
}
