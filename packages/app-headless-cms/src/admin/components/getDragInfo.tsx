import React from "react";
import { plugins } from "@webiny/plugins";
import type {
    CmsModelFieldTypePlugin,
    CmsModelLayoutFieldTypePlugin,
    DragSource
} from "~/types.js";

export interface DragInfo {
    label: string;
    icon?: React.ReactElement;
}

export const getDragInfo = (item: DragSource | null): DragInfo => {
    if (!item) {
        return { label: "" };
    }

    if (item.type === "newField" && item.fieldType) {
        const plugin = plugins
            .byType<CmsModelFieldTypePlugin>("cms-editor-field-type")
            .find(p => p.field.type === item.fieldType);
        return {
            label: plugin?.field.label ?? item.fieldType,
            icon: plugin?.field.icon as React.ReactElement | undefined
        };
    }

    if (item.type === "field" && item.field) {
        const plugin = plugins
            .byType<CmsModelFieldTypePlugin>("cms-editor-field-type")
            .find(p => p.field.type === item.field!.type);
        return {
            label: item.field.label,
            icon: plugin?.field.icon as React.ReactElement | undefined
        };
    }

    if (item.type === "newLayoutField" && item.layoutFieldType) {
        const plugin = plugins
            .byType<CmsModelLayoutFieldTypePlugin>("cms-editor-layout-field-type")
            .find(p => p.field.type === item.layoutFieldType);
        return {
            label: plugin?.field.label ?? item.layoutFieldType,
            icon: plugin?.field.icon as React.ReactElement | undefined
        };
    }

    if (item.type === "layoutField" && item.layoutField) {
        const plugin = plugins
            .byType<CmsModelLayoutFieldTypePlugin>("cms-editor-layout-field-type")
            .find(p => p.field.type === item.layoutField!.type);
        return {
            label: plugin?.field.label ?? "Layout",
            icon: plugin?.field.icon as React.ReactElement | undefined
        };
    }

    if (item.type === "row") {
        return { label: "Row" };
    }

    return { label: "Field" };
};
