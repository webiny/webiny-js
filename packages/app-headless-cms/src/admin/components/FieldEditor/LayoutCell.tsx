import React from "react";
import type { CmsLayoutDescriptor } from "@webiny/app-headless-cms-common/types/model.js";
import { useModelFieldEditor } from "./useModelFieldEditor.js";
import { Text } from "@webiny/admin-ui";

interface LayoutCellProps {
    descriptor: CmsLayoutDescriptor;
    rowIndex: number;
    cellIndex: number;
}

export const LayoutCell = ({ descriptor }: LayoutCellProps) => {
    const { getLayoutFieldPlugin, updateLayoutCell, deleteLayoutCell } = useModelFieldEditor();

    const plugin = getLayoutFieldPlugin(descriptor.type);

    if (!plugin) {
        return (
            <div className={"p-md bg-destructive-dimmed rounded-xs"}>
                <Text size={"sm"}>Unknown layout field type: &quot;{descriptor.type}&quot;</Text>
            </div>
        );
    }

    const onUpdate = (d: CmsLayoutDescriptor) => {
        updateLayoutCell(descriptor.id, d);
    };

    const onDelete = () => {
        deleteLayoutCell(descriptor.id);
    };

    return plugin.field.render({ descriptor, onUpdate, onDelete });
};
