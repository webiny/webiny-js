import type { CmsModelField, CmsEditorFieldsLayout } from "~/types/model.js";
import type { CmsLayoutFieldTypePlugin } from "~/types/index.js";
import { isLayoutDescriptor } from "~/types/model.js";

export interface FieldOption {
    label: string;
    value: string;
    fieldType: string;
}

/**
 * Walk a model layout and collect label prefixes for each field ID by delegating
 * to `getFieldLabelPrefixes` on the matching layout-field-type plugin.
 *
 * Returns a map from fieldId to its label prefix string
 * (e.g., `"metaTitle" → "My Tabs › SEO"`).
 */
export function buildFieldLabelPrefixes(
    layout: CmsEditorFieldsLayout,
    plugins: CmsLayoutFieldTypePlugin[]
): Map<string, string> {
    const map = new Map<string, string>();
    const pluginByType = new Map(plugins.map(p => [p.field.type, p]));

    for (const row of layout) {
        for (const cell of row) {
            if (!isLayoutDescriptor(cell)) {
                continue;
            }

            const plugin = pluginByType.get(cell.type);
            if (!plugin?.field.getFieldLabelPrefixes) {
                continue;
            }

            const prefixes = plugin.field.getFieldLabelPrefixes({ descriptor: cell });
            for (const [fieldId, prefix] of Object.entries(prefixes)) {
                map.set(fieldId, prefix);
            }
        }
    }

    return map;
}

/**
 * Build a flat list of field options from the model's field tree.
 * Paths are absolute using fieldId segments, with `$` for list-object children
 * (e.g., `panorama.hotspots.$.title`).
 *
 * When `fieldLabelPrefixes` is provided, fields whose IDs appear in the map will
 * have the layout hierarchy prepended to their labels
 * (e.g., `"My Tabs › SEO › Meta Title"`).
 *
 * When `layoutPlugins` is provided, nested layouts inside object fields
 * (e.g., tabs inside an object field) are also scanned for label prefixes.
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
    labelPrefix = "",
    fieldLabelPrefixes?: Map<string, string>,
    layoutPlugins?: CmsLayoutFieldTypePlugin[]
): FieldOption[] {
    const options: FieldOption[] = [];

    for (const field of fields) {
        const path = prefix + field.fieldId;
        const layoutPrefix = fieldLabelPrefixes?.get(field.id);
        const label = layoutPrefix
            ? `${labelPrefix}${layoutPrefix} › ${field.label}`
            : labelPrefix + field.label;

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
            // Build label prefixes from the object field's own layout (e.g., tabs inside an object).
            let childPrefixes: Map<string, string> | undefined;
            if (layoutPlugins && field.settings?.layout) {
                childPrefixes = buildFieldLabelPrefixes(field.settings.layout, layoutPlugins);
            }

            if (field.list) {
                // List object: emit .length pseudo-option
                options.push({
                    label: `${label} › Length`,
                    value: `${path}.length`,
                    fieldType: "number"
                });
                // Recurse children with $ segment
                options.push(
                    ...buildFieldOptions(
                        childFields,
                        `${path}.$.`,
                        `${label} › `,
                        childPrefixes,
                        layoutPlugins
                    )
                );
            } else {
                // Non-list object: recurse into children
                options.push(
                    ...buildFieldOptions(
                        childFields,
                        `${path}.`,
                        `${label} › `,
                        childPrefixes,
                        layoutPlugins
                    )
                );
            }
            continue;
        }

        // Leaf field
        options.push({ label, value: path, fieldType: field.type });
    }

    return options;
}
