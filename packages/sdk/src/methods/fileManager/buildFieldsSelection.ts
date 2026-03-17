/**
 * Helper to build GraphQL fields selection from fields array.
 * Supports both top-level fields (e.g., "id", "name") and nested fields (e.g., "location.folderId", "createdBy.displayName").
 * Properly merges nested fields that share common parent paths.
 *
 * @param fields - Array of field paths in dot notation
 * @returns GraphQL selection string with proper field nesting
 *
 * @example
 * buildFieldsSelection(["id", "name", "location.folderId", "createdBy.id", "createdBy.displayName"])
 * // Returns:
 * // id
 * // name
 * // location {
 * //   folderId
 * // }
 * // createdBy {
 * //   id
 * //   displayName
 * // }
 */
export const buildFieldsSelection = (fields: string[]): string => {
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
