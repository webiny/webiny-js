import React from "react";
import { plugins } from "@webiny/plugins";
import type { CmsModelLayoutFieldTypePlugin, DragSource } from "~/types.js";
import type { ICmsFieldType } from "~/presentation/fieldTypes/abstractions.js";

export interface DragInfo {
    label: string;
    icon?: React.ReactElement;
}

export const getDragInfo = (
    item: DragSource | null,
    fieldTypesMap: Map<string, ICmsFieldType>
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
        const plugin = plugins
            .byType<CmsModelLayoutFieldTypePlugin>("cms-editor-layout-field-type")
            .find(p => p.field.type === item.layoutFieldType);
        return {
            label: plugin ? plugin.field.label : item.layoutFieldType,
            icon: plugin ? (plugin.field.icon as React.ReactElement) : undefined
        };
    }

    if (item.type === "layoutField" && item.layoutField) {
        const plugin = plugins
            .byType<CmsModelLayoutFieldTypePlugin>("cms-editor-layout-field-type")
            .find(p => p.field.type === item.layoutField!.type);
        return {
            label: plugin ? plugin.field.label : "Layout",
            icon: plugin ? (plugin.field.icon as React.ReactElement) : undefined
        };
    }

    if (item.type === "row") {
        return { label: "Row" };
    }

    return { label: "Field" };
};
