import { immutableDelete, immutableSet } from "@webiny/stdlib";
import type {
    CmsEditorFieldId,
    CmsModel as BaseCmsModel,
    CmsModelField,
    FieldLayoutPosition
} from "~/types.js";
import getFieldPosition from "./getFieldPosition.js";

type CmsModel = Required<Pick<BaseCmsModel, "fields" | "layout">>;

interface MoveFieldParams<T> {
    field: CmsEditorFieldId | Pick<CmsModelField, "id">;
    position: FieldLayoutPosition;
    data: T;
}

const moveField = <T extends CmsModel>(params: MoveFieldParams<T>) => {
    const { field, position, data: prev } = params;
    const { row, index } = position;
    const fieldId = typeof field === "string" ? field : field.id;

    let next: T = {
        ...prev,
        layout: prev.layout ? prev.layout || [] : []
    };

    const existingPosition = getFieldPosition({ field: fieldId, data: prev });

    if (existingPosition) {
        next = immutableDelete(
            prev,
            `layout.${existingPosition.row}.${existingPosition.index}`
        ) as T;
    }

    // Setting a form field into a new non-existing row.
    if (!next.layout[row]) {
        return immutableSet(next, `layout.${row}`, [fieldId]);
    }

    // Drop the field at the specified index.
    if (index === null) {
        // Create a new row with the new field at the given row index,
        return immutableSet(next, "layout", (layout: string[][]) => {
            const newLayout = [...layout];
            newLayout.splice(row, 0, [fieldId]);
            return newLayout;
        });
    }

    return immutableSet(next, `layout.${row}`, (layout: string[]) => {
        const newLayout = [...layout];
        newLayout.splice(index, 0, fieldId);
        return newLayout;
    });
};

export default <T extends CmsModel>(params: MoveFieldParams<T>): T => {
    return immutableSet(moveField<T>(params), "layout", (layout: string[][]) => {
        return [...layout].filter(row => row.length > 0);
    });
};
