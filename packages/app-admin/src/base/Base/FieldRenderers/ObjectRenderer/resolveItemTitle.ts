import type { IFieldValueFormatter, IFieldVM, IValueOption } from "~/features/formModel/index.js";

type ItemStringSetting = string | ((data: Record<string, unknown>, index: number) => string);

function fieldsToData(fields: IFieldVM[]): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    for (const field of fields) {
        data[field.name] = field.value;
    }
    return data;
}

function formatScalar(value: unknown, options: IValueOption[] | undefined): string {
    if (value === null || value === undefined || typeof value === "object") {
        return "";
    }
    // Predefined values store the option's value; the editor knows the option by its label.
    const option = options?.find(o => String(o.value) === String(value));
    return option ? option.label : String(value);
}

/**
 * The text a field's value reads as in a summary. A formatter registered for the field's type
 * wins; otherwise each value is printed, swapped for its option label when the field has options.
 */
export function formatFieldValue(field: IFieldVM, formatters: IFieldValueFormatter[]): string {
    const formatter = formatters.find(f => f.type === field.type);
    if (formatter) {
        return formatter.format(field) ?? "";
    }

    const values = Array.isArray(field.value) ? field.value : [field.value];
    return values
        .map(value => formatScalar(value, field.options))
        .filter(Boolean)
        .join(", ");
}

function resolveSetting(
    fields: IFieldVM[],
    index: number,
    setting: ItemStringSetting,
    formatters: IFieldValueFormatter[]
): string {
    if (typeof setting === "string") {
        const field = fields.find(f => f.name === setting);
        return field ? formatFieldValue(field, formatters) : "";
    }

    return setting(fieldsToData(fields), index);
}

export function resolveItemTitle(
    fields: IFieldVM[],
    index: number,
    fallback: string,
    itemTitle: ItemStringSetting | undefined,
    formatters: IFieldValueFormatter[]
): string {
    if (!itemTitle) {
        return fallback;
    }

    return resolveSetting(fields, index, itemTitle, formatters) || fallback;
}

export function resolveItemDescription(
    fields: IFieldVM[],
    index: number,
    itemDescription: ItemStringSetting | undefined,
    formatters: IFieldValueFormatter[]
): string | undefined {
    if (!itemDescription) {
        return undefined;
    }

    return resolveSetting(fields, index, itemDescription, formatters) || undefined;
}
