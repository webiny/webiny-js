import type { CmsContext } from "~/types/index.js";
import type { CmsModel } from "~/types/index.js";

/**
 * Helper to get error message from unknown error.
 */
export const getErrorMessage = (error: unknown, fallback: string): string => {
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === "string") {
        return error;
    }
    return fallback;
};

/**
 * Helper to get model by modelId.
 */
export const getModel = async (context: CmsContext, modelId: string): Promise<CmsModel> => {
    const model = await context.cms.getModel(modelId);
    if (!model) {
        throw new Error(`Model "${modelId}" not found`);
    }
    return model;
};

/**
 * Helper to build GraphQL fields selection from fields array.
 * Fields are always nested under 'values' in CMS entries.
 */
export const buildFieldsSelection = (fields?: string[]): string => {
    if (!fields || fields.length === 0) {
        return `
            id
            entryId
            values
        `;
    }

    // Build nested field structure
    const fieldLines = fields.map(field => {
        // Handle nested fields like "author.name" or "author.company.name"
        const parts = field.split(".");
        if (parts.length === 1) {
            return `    ${field}`;
        }

        // For nested fields, build the structure
        let indent = "    ";
        let result = "";
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (i === parts.length - 1) {
                result += `${indent}${part}\n`;
            } else {
                result += `${indent}${part} {\n`;
                indent += "    ";
            }
        }
        // Close braces
        for (let i = 0; i < parts.length - 1; i++) {
            indent = indent.substring(4);
            result += `${indent}}\n`;
        }
        return result.trimEnd();
    });

    return `
        id
        entryId
        values {
${fieldLines.join("\n")}
        }
    `;
};
