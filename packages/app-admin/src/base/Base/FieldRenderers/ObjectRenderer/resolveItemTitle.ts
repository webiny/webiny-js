import type { IFieldVM, IObjectFieldItemVM } from "~/features/formModel/index.js";

type ItemTitleSetting = string | ((data: Record<string, unknown>, index: number) => string);

function fieldsToData(fields: IFieldVM[]): Record<string, unknown> {
    const data: Record<string, unknown> = {};
    for (const field of fields) {
        data[field.name] = field.value;
    }
    return data;
}

export function resolveItemTitle(
    item: IObjectFieldItemVM,
    index: number,
    label: string | undefined,
    itemTitle: ItemTitleSetting | undefined
): string {
    const fallback = `${label || "Item"} #${index + 1}`;

    if (!itemTitle) {
        return fallback;
    }

    if (typeof itemTitle === "string") {
        const field = item.fields.find(f => f.name === itemTitle);
        const value = field ? String(field.value ?? "") : "";
        return value || fallback;
    }

    const data = fieldsToData(item.fields);
    return itemTitle(data, index) || fallback;
}
