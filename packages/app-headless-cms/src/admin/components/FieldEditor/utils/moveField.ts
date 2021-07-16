import dot from "dot-prop-immutable";
import { CmsEditorField, CmsEditorFieldId, FieldLayoutPosition } from "~/types";
import getFieldPosition from "./getFieldPosition";

const moveField = ({ field, position, data }) => {
    const { row, index } = position;
    const fieldId = typeof field === "string" ? field : field.id;

    const existingPosition = getFieldPosition({ field: fieldId, data });

    if (existingPosition) {
        data = dot.delete(data, `layout.${existingPosition.row}.${existingPosition.index}`);
    }

    // Setting a form field into a new non-existing row.
    if (!data.layout[row]) {
        return dot.set(data, `layout.${row}`, [fieldId]);
    }

    // Drop the field at the specified index.
    if (index === null) {
        // Create a new row with the new field at the given row index,
        return dot.set(data, "layout", layout => {
            const newLayout = [...layout];
            newLayout.splice(row, 0, [fieldId]);
            return newLayout;
        });
    }

    return dot.set(data, `layout.${row}`, layout => {
        const newLayout = [...layout];
        newLayout.splice(index, 0, fieldId);
        return newLayout;
    });
};

export default (params: {
    field: CmsEditorFieldId | CmsEditorField;
    position: FieldLayoutPosition;
    data: object;
}) => {
    return dot.set(moveField(params), "layout", layout => {
        return [...layout].filter(row => row.length > 0);
    });
};
