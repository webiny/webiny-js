import { FbFormModel, FbFormModelField, FieldIdType, FieldLayoutPositionType } from "~/types";
import getFieldPosition from "./getFieldPosition";

/**
 * Remove all rows that have zero fields in it.
 * @param data
 */
const cleanupEmptyRows = (data: FbFormModel): void => {
    data.layout = data.layout.filter(row => row.length > 0);
};

interface MoveFieldParams {
    field: FieldIdType | FbFormModelField;
    position: FieldLayoutPositionType;
    data: FbFormModel;
}

const moveField = (params: MoveFieldParams) => {
    const { field, position, data } = params;
    const { row, index } = position;
    const fieldId = typeof field === "string" ? field : field._id;
    if (!fieldId) {
        console.log("Missing data when moving field.");
        console.log(params);
        return;
    }

    const existingPosition = getFieldPosition({
        field: fieldId,
        data
    });

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

export default (params: MoveFieldParams) => {
    moveField(params);
    cleanupEmptyRows(params.data);
};
