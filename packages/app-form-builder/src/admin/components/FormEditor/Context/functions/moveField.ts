import { FbFormModel, FbFormModelField, FieldIdType, FieldLayoutPositionType } from "~/types";
import getFieldPosition from "./getFieldPosition";

/**
 * Remove all rows that have zero fields in it.
 * @param data
 */

// TODO: Remove all ts-ignores and rename anotherStepLayout & anotherStepId
const cleanupEmptyRows = (data: FbFormModel, params: any): void => {
    const { stepId, anotherStepId } = params;
    const targetStep = data.steps.find(s => s.id === stepId);
    const sourceStep = anotherStepId !== undefined && data.steps.find(s => s.id === anotherStepId);

    if (sourceStep) {
        // @ts-ignore
        sourceStep.layout = sourceStep?.layout.filter(row => row.length > 0);
    }

    // @ts-ignore
    targetStep.layout = targetStep?.layout.filter(row => row.length > 0);
};

interface MoveFieldParams {
    field: FieldIdType | FbFormModelField;
    position: FieldLayoutPositionType;
    data: FbFormModel;
    stepId?: string;
    [key: string]: any;
}

const moveField = (params: MoveFieldParams) => {
    const { field, position, data, stepId, anotherStepId } = params;
    const { row, index } = position;
    const fieldId = typeof field === "string" ? field : field._id;
    if (!fieldId) {
        console.log("Missing data when moving field.");
        console.log(params);
        return;
    }

    const stepLayout = data.steps.find(s => s.id === stepId);
    const anotherStepLayout =
        anotherStepId !== undefined ? data.steps.find(s => s.id === anotherStepId) : stepLayout;
    // @ts-ignore
    const layoutToCheck = anotherStepLayout;
    const existingPosition = getFieldPosition({
        field: fieldId,
        // @ts-ignore
        data: layoutToCheck
    });
    if (existingPosition) {
        //@ts-ignore
        layoutToCheck.layout[existingPosition.row].splice(existingPosition.index, 1);
    }

    // Setting a form field into a new non-existing row.
    if (!stepLayout?.layout[row]) {
        //@ts-ignore
        stepLayout.layout[row] = [fieldId];
        return;
    }

    // If row exists, we drop the field at the specified index.
    if (index === null) {
        // Create a new row with the new field at the given row index,
        stepLayout.layout.splice(row, 0, [fieldId]);
        return;
    }

    stepLayout.layout[row].splice(index, 0, fieldId);
};

export default (params: MoveFieldParams) => {
    moveField(params);
    cleanupEmptyRows(params.data, params);
};
