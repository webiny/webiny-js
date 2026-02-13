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
 * Supports both top-level fields (e.g., "createdOn", "id") and values fields (e.g., "values.author.name").
 * Properly merges nested fields that share common parent paths.
 *
 * @param fields - Optional array of field paths in dot notation
 * @returns GraphQL selection string with proper field nesting
 *
 * @example
 * buildFieldsSelection(["id", "entryId", "createdOn", "values.name", "values.author.name", "values.author.email"])
 * // Returns:
 * // id
 * // entryId
 * // createdOn
 * // values {
 * //   name
 * //   author {
 * //     name
 * //     email
 * //   }
 * // }
 */
export const buildFieldsSelection = (fields?: string[]): string => {
    if (!fields || fields.length === 0) {
        return `
            id
            entryId
            values
        `;
    }

    // Separate top-level fields from values fields.
    const topLevelFields: Set<string> = new Set();
    const valuesFields: string[] = [];

    fields.forEach(field => {
        if (field.startsWith("values.")) {
            // Extract the field path after "values."
            valuesFields.push(field.substring(7)); // Remove "values." prefix
        } else {
            // Top-level field.
            topLevelFields.add(field);
        }
    });

    // Build a tree structure for nested values fields to avoid duplicate parent paths.
    interface FieldNode {
        [key: string]: FieldNode | null;
    }

    const fieldTree: FieldNode = {};

    // Parse all values fields into the tree structure.
    valuesFields.forEach(field => {
        const parts = field.split(".");
        let current = fieldTree;

        parts.forEach((part, index) => {
            if (!current[part]) {
                // Leaf node (null) or new branch (empty object)
                current[part] = index === parts.length - 1 ? null : {};
            } else if (current[part] === null && index < parts.length - 1) {
                // Convert leaf to branch if we need to traverse deeper
                current[part] = {};
            }
            if (current[part] !== null) {
                current = current[part] as FieldNode;
            }
        });
    });

    /**
     * Recursively converts the field tree into a GraphQL selection string.
     *
     * @param node - The current field tree node to process
     * @param indent - Current indentation level for formatting
     * @returns GraphQL selection string for this node and its children
     *
     * Handles two cases:
     * - Leaf nodes (value === null): Simple field name
     * - Branch nodes (value === object): Field name with nested selection in braces
     */
    const buildSelection = (node: FieldNode, indent: string = "    "): string => {
        const lines: string[] = [];

        Object.keys(node)
            .sort()
            .forEach(key => {
                const value = node[key];
                if (value === null) {
                    // Leaf field - just the field name
                    lines.push(`${indent}${key}`);
                } else {
                    // Branch field - field name with nested selection
                    lines.push(`${indent}${key} {`);
                    lines.push(buildSelection(value, indent + "    "));
                    lines.push(`${indent}}`);
                }
            });

        return lines.join("\n");
    };

    // Build the top-level fields selection
    const topLevelSelection = Array.from(topLevelFields)
        .sort()
        .map(f => `        ${f}`)
        .join("\n");

    // If we have values fields, build the values block
    if (Object.keys(fieldTree).length > 0) {
        const valuesSelection = buildSelection(fieldTree);
        return `
${topLevelSelection}
        values {
${valuesSelection}
        }
    `;
    }

    // If no values fields, just return top-level fields
    return `
${topLevelSelection}
    `;
};
