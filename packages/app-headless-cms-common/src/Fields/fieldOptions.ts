import type { CmsModelField } from "~/types/model.js";

export interface FieldOption {
    label: string;
    value: string;
    fieldType: string;
}

/**
 * Build a flat list of field options from the model's field tree.
 * Paths are absolute using fieldId segments, with `$` for list-object children
 * (e.g., `panorama.hotspots.$.title`).
 *
 * Recursion rules:
 * - Leaf field (no settings.fields): emit option
 * - Object field (settings.fields, not list): recurse with prefix
 * - List object field (settings.fields, list: true): emit `.length` pseudo-option,
 *   then recurse children with `.$` segment
 * - dynamicZone: skip
 * - ref: emit for isEmpty checks, skip children
 */
export function buildFieldOptions(
    fields: CmsModelField[],
    prefix = "",
    labelPrefix = ""
): FieldOption[] {
    const options: FieldOption[] = [];

    for (const field of fields) {
        const path = prefix + field.fieldId;
        const label = labelPrefix + field.label;

        // Dynamic zone: emit .length pseudo-option only, skip children
        if (field.type === "dynamicZone") {
            options.push({
                label: `${label} › Length`,
                value: `${path}.length`,
                fieldType: "number"
            });
            continue;
        }

        const childFields = field.settings?.fields;

        // Ref field: include for isEmpty checks, skip children
        if (field.type === "ref") {
            options.push({ label, value: path, fieldType: field.type });
            continue;
        }

        // Object with child fields
        if (childFields && childFields.length > 0) {
            if (field.list) {
                // List object: emit .length pseudo-option
                options.push({
                    label: `${label} › Length`,
                    value: `${path}.length`,
                    fieldType: "number"
                });
                // Recurse children with $ segment
                options.push(...buildFieldOptions(childFields, `${path}.$.`, `${label} › `));
            } else {
                // Non-list object: recurse into children
                options.push(...buildFieldOptions(childFields, `${path}.`, `${label} › `));
            }
            continue;
        }

        // Leaf field
        options.push({ label, value: path, fieldType: field.type });
    }

    return options;
}
