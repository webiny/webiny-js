import React from "react";
import type { CmsLayoutField } from "@webiny/app-headless-cms-common/types/model.js";
import { useModelFieldEditor } from "./useModelFieldEditor.js";
import { Text } from "@webiny/admin-ui";

interface LayoutCellProps {
    field: CmsLayoutField;
    rowIndex: number;
    cellIndex: number;
}

export const LayoutCell = ({ field }: LayoutCellProps) => {
    const { getLayoutFieldType, updateLayoutCell, deleteLayoutCell } = useModelFieldEditor();

    const layoutFieldType = getLayoutFieldType(field.type);

    if (!layoutFieldType) {
        return (
            <div className={"p-md bg-destructive-dimmed rounded-xs"}>
                <Text size={"sm"}>Unknown layout field type: &quot;{field.type}&quot;</Text>
            </div>
        );
    }

    const onUpdate = (d: CmsLayoutField) => {
        updateLayoutCell(field.id, d);
    };

    const onDelete = () => {
        deleteLayoutCell(field.id);
    };

    return layoutFieldType.render({ field, onUpdate, onDelete });
};
