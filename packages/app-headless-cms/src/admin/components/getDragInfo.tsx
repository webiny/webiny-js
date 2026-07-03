import React from "react";
import type { DragSource } from "~/types.js";
import type { ICmsFieldType } from "~/presentation/fieldTypes/abstractions.js";
import type { ICmsLayoutFieldType } from "~/presentation/fieldTypes/abstractions.js";

export interface DragInfo {
    label: string;
    icon?: React.ReactElement;
}

export const getDragInfo = (
    item: DragSource | null,
    fieldTypesMap: Map<string, ICmsFieldType>,
    layoutFieldTypesMap: Map<string, ICmsLayoutFieldType>
): DragInfo => {
    if (!item) {
        return { label: "" };
    }

    if (item.type === "newField" && item.fieldType) {
        const ft = fieldTypesMap.get(item.fieldType);
        return {
            label: ft ? ft.label : item.fieldType,
            icon: ft ? ft.icon : undefined
        };
    }

    if (item.type === "field" && item.field) {
        const ft = fieldTypesMap.get(item.field.type);
        return {
            label: item.field.label,
            icon: ft ? ft.icon : undefined
        };
    }

    if (item.type === "newLayoutField" && item.layoutFieldType) {
        const lft = layoutFieldTypesMap.get(item.layoutFieldType);
        return {
            label: lft ? lft.label : item.layoutFieldType,
            icon: lft ? lft.icon : undefined
        };
    }

    if (item.type === "layoutField" && item.layoutField) {
        const lft = layoutFieldTypesMap.get(item.layoutField.type);
        return {
            label: lft ? lft.label : "Layout",
            icon: lft ? lft.icon : undefined
        };
    }

    if (item.type === "row") {
        return { label: "Row" };
    }

    return { label: "Field" };
};
