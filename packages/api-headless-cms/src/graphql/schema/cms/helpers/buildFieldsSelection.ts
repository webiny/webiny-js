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

    const rawSelections: string[] = [];
    const dotFields: string[] = [];

    for (const field of fields) {
        if (field.includes("{")) {
            rawSelections.push(field);
        } else {
            dotFields.push(field);
        }
    }

    interface FieldNode {
        [key: string]: FieldNode | null;
    }

    const fieldTree: FieldNode = {};

    dotFields.forEach(field => {
        const parts = field.split(".");
        let current = fieldTree;

        parts.forEach((part, index) => {
            if (current[part] === undefined) {
                current[part] = index === parts.length - 1 ? null : {};
            } else if (current[part] === null && index < parts.length - 1) {
                current[part] = {};
            }
            if (current[part] !== null) {
                current = current[part] as FieldNode;
            }
        });
    });

    const buildSelection = (node: FieldNode, indent: string = "        "): string => {
        const lines: string[] = [];

        Object.keys(node)
            .sort()
            .forEach(key => {
                const value = node[key];
                if (value === null) {
                    lines.push(`${indent}${key}`);
                } else {
                    lines.push(`${indent}${key} {`);
                    lines.push(buildSelection(value, indent + "    "));
                    lines.push(`${indent}}`);
                }
            });

        return lines.join("\n");
    };

    const parts: string[] = [];

    if (dotFields.length > 0) {
        parts.push(buildSelection(fieldTree));
    }

    for (const raw of rawSelections) {
        parts.push(`        ${raw}`);
    }

    return parts.join("\n");
};
