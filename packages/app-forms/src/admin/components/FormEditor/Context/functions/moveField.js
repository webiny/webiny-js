// @flow
import type { FieldType, FieldIdType, FieldLayoutPositionType } from "@webiny/app-forms/types";
import getFieldPosition from "./getFieldPosition";

/**
 * Remove all rows that have zero fields in it.
 * @param data
 */
const cleanupEmptyRows = data => {
    data.layout = data.layout.filter(row => row.length > 0);
};

const moveField = ({ field, position, data }) => {
    const { row, index } = position;
    const fieldId = typeof field === "string" ? field : field._id;

    const existingPosition = getFieldPosition({ field: fieldId, data });
    if (existingPosition) {
        data.layout[existingPosition.row].splice(existingPosition.index, 1);
    }

    // Setting a form field into a new non-existing row.
    if (!data.layout[row]) {
        data.layout[row] = [fieldId];
        return;
    }

    // If row exists, we drop the field at the specified index.
    if (index === null) {
        // Create a new row with the new field at the given row index,
        data.layout.splice(row, 0, [fieldId]);
        return;
    }

    data.layout[row].splice(index, 0, fieldId);
};

export default (params: {
    field: FieldIdType | FieldType,
    position: FieldLayoutPositionType,
    data: Object
}) => {
    moveField(params);
    cleanupEmptyRows(params.data);
};
