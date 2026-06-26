import type { CmsModelField, CmsEditorFieldsLayout } from "~/types.js";
import { isLayoutField } from "~/types.js";
import type { ICmsLayoutFieldType } from "~/presentation/fieldTypes/abstractions.js";

export interface FieldOption {
    label: string;
    value: string;
    fieldType: string;
}

export function buildFieldLabelPrefixes(
    layout: CmsEditorFieldsLayout,
    layoutFieldTypes: ICmsLayoutFieldType[]
): Map<string, string> {
    const map = new Map<string, string>();
    const byType = new Map(layoutFieldTypes.map(ft => [ft.type, ft]));

    for (const row of layout) {
        for (const cell of row) {
            if (!isLayoutField(cell)) {
                continue;
            }

            const fieldType = byType.get(cell.type);
            if (!fieldType || !fieldType.getFieldLabelPrefixes) {
                continue;
            }

            const prefixes = fieldType.getFieldLabelPrefixes({ field: cell });
            for (const [fieldId, prefix] of Object.entries(prefixes)) {
                map.set(fieldId, prefix);
            }
        }
    }

    return map;
}

export function buildFieldOptions(
    fields: CmsModelField[],
    prefix = "",
    labelPrefix = "",
    fieldLabelPrefixes?: Map<string, string>,
    layoutFieldTypes?: ICmsLayoutFieldType[]
): FieldOption[] {
    const options: FieldOption[] = [];

    for (const field of fields) {
        const path = prefix + field.fieldId;
        const layoutPrefix = fieldLabelPrefixes?.get(field.id);
        const label = layoutPrefix
            ? `${labelPrefix}${layoutPrefix} › ${field.label}`
            : labelPrefix + field.label;

        if (field.type === "dynamicZone") {
            options.push({
                label: `${label} › Length`,
                value: `${path}.length`,
                fieldType: "number"
            });
            continue;
        }

        const childFields = field.settings?.fields;

        if (field.type === "ref") {
            options.push({ label, value: path, fieldType: field.type });
            continue;
        }

        if (childFields && childFields.length > 0) {
            let childPrefixes: Map<string, string> | undefined;
            if (layoutFieldTypes && field.settings?.layout) {
                childPrefixes = buildFieldLabelPrefixes(field.settings.layout, layoutFieldTypes);
            }

            if (field.list) {
                options.push({
                    label: `${label} › Length`,
                    value: `${path}.length`,
                    fieldType: "number"
                });
                options.push(
                    ...buildFieldOptions(
                        childFields,
                        `${path}.$.`,
                        `${label} › `,
                        childPrefixes,
                        layoutFieldTypes
                    )
                );
            } else {
                options.push(
                    ...buildFieldOptions(
                        childFields,
                        `${path}.`,
                        `${label} › `,
                        childPrefixes,
                        layoutFieldTypes
                    )
                );
            }
            continue;
        }

        options.push({ label, value: path, fieldType: field.type });
    }

    return options;
}
