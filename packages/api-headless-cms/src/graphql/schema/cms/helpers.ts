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
 * Transforms sort parameter to array of strings format expected by GraphQL schema.
 * Handles two input formats:
 * 1. Object format: {createdOn: "desc"} -> ["createdOn_DESC"]
 * 2. Array of strings: ["createdOn_DESC"] -> ["createdOn_DESC"] (pass through)
 *
 * @param sort - Sort parameter (object or array of strings)
 * @returns Array of strings in format ["field_ASC"|"field_DESC"] or undefined if no sort provided
 *
 * @example
 * transformSortToArray({createdOn: "desc"})
 * // Returns: ["createdOn_DESC"]
 *
 * @example
 * transformSortToArray(["createdOn_DESC", "name_ASC"])
 * // Returns: ["createdOn_DESC", "name_ASC"]
 */
export const transformSortToArray = (
    sort?: Record<string, unknown> | string[]
): string[] | undefined => {
    if (!sort) {
        return undefined;
    }

    // Handle array of strings format: ["createdOn_DESC", "name_ASC"]
    if (Array.isArray(sort)) {
        return sort.map(item => String(item));
    }

    // Handle object format: {createdOn: "desc", name: "asc"}
    if (typeof sort === "object") {
        return Object.entries(sort).map(([field, direction]) => {
            const normalizedDirection = String(direction).toUpperCase();
            return `${field}_${normalizedDirection}`;
        });
    }

    return undefined;
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

    interface FieldNode {
        [key: string]: FieldNode | null;
    }

    const fieldTree: FieldNode = {};

    fields.forEach(field => {
        const parts = field.split(".");
        let current = fieldTree;

        parts.forEach((part, index) => {
            if (current[part] === undefined) {
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
    const buildSelection = (node: FieldNode, indent: string = "        "): string => {
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

    return buildSelection(fieldTree);
};
