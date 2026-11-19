const GRAPHQL_NAME = /^[_A-Za-z][_0-9A-Za-z]*$/;

const isValidFieldName = (name: string): boolean => {
    return GRAPHQL_NAME.test(name);
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

    // Security: the tree has no prototype, so caller-supplied keys can never reach Object.prototype.
    const fieldTree: FieldNode = Object.create(null);

    fields.forEach(field => {
        const parts = field.split(".");
        // Security: each part is inserted into a GraphQL query, so it must be a plain GraphQL name.
        for (const part of parts) {
            if (!isValidFieldName(part)) {
                throw new Error(`Invalid field "${field}".`);
            }
        }
        let current = fieldTree;

        parts.forEach((part, index) => {
            if (current[part] === undefined) {
                // Leaf node (null) or new branch (empty object)
                current[part] = index === parts.length - 1 ? null : Object.create(null);
            } else if (current[part] === null && index < parts.length - 1) {
                // Convert leaf to branch if we need to traverse deeper
                current[part] = Object.create(null);
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
