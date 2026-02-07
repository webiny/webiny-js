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
 * Properly merges nested fields that share common parent paths.
 */
export const buildFieldsSelection = (fields?: string[]): string => {
    if (!fields || fields.length === 0) {
        return `
            id
            entryId
            values
        `;
    }

    // Build a tree structure for nested fields
    interface FieldNode {
        [key: string]: FieldNode | null;
    }

    const fieldTree: FieldNode = {};

    // Parse all fields into the tree
    fields.forEach(field => {
        const parts = field.split(".");
        let current = fieldTree;

        parts.forEach((part, index) => {
            if (!current[part]) {
                // Leaf node or new branch
                current[part] = index === parts.length - 1 ? null : {};
            } else if (current[part] === null && index < parts.length - 1) {
                // Convert leaf to branch if needed
                current[part] = {};
            }
            if (current[part] !== null) {
                current = current[part] as FieldNode;
            }
        });
    });

    // Convert tree to GraphQL selection string
    const buildSelection = (node: FieldNode, indent: string = "    "): string => {
        const lines: string[] = [];
        
        Object.keys(node).sort().forEach(key => {
            const value = node[key];
            if (value === null) {
                // Leaf field
                lines.push(`${indent}${key}`);
            } else {
                // Nested field
                lines.push(`${indent}${key} {`);
                lines.push(buildSelection(value, indent + "    "));
                lines.push(`${indent}}`);
            }
        });

        return lines.join("\n");
    };

    const fieldsSelection = buildSelection(fieldTree);

    return `
        id
        entryId
        values {
${fieldsSelection}
        }
    `;
};
