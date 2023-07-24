import {
    FbFormModel,
    FbFormModelField,
    FbFormStep,
    FieldIdType,
    FieldLayoutPositionType
} from "~/types";
import getFieldPosition from "./getFieldPosition";

/**
 * Remove all rows that have zero fields in it.
 * @param data
 */

const cleanupEmptyRows = (params: MoveFieldBetweenRowsParams): void => {
    const { data, targetStepId, sourceStepId } = params;
    const targetStep = data.steps.find(s => s.id === targetStepId) as FbFormStep;
    const sourceStep = sourceStepId !== undefined && data.steps.find(s => s.id === sourceStepId);

    if (sourceStep) {
        sourceStep.layout = sourceStep?.layout.filter(row => row.length > 0);
    }

    targetStep.layout = targetStep.layout.filter(row => row.length > 0);
};

interface MoveFieldBetweenRowsParams {
    field: FieldIdType | FbFormModelField;
    position: FieldLayoutPositionType;
    data: FbFormModel;
    targetStepId: string;
    sourceStepId: string;
}

const moveFieldBetweenSteps = (params: MoveFieldBetweenRowsParams) => {
    const { field, position, data, targetStepId, sourceStepId } = params;
    const { row, index } = position;
    const fieldId = typeof field === "string" ? field : field._id;
    if (!fieldId) {
        console.log("Missing data when moving field.");
        console.log(params);
        return;
    }

    const targetStepLayout = data.steps.find(s => s.id === targetStepId) as FbFormStep;
    const sourceStepLayout = data.steps.find(s => s.id === sourceStepId) as FbFormStep;
    const existingPosition = getFieldPosition({
        field: fieldId,
        data: sourceStepLayout || targetStepLayout
    });
    if (existingPosition) {
        sourceStepLayout.layout[existingPosition.row].splice(existingPosition.index, 1);
    }

    // Setting a form field into a new non-existing row.
    if (!targetStepLayout?.layout[row]) {
        targetStepLayout.layout[row] = [fieldId];
        return;
    }

    // If row exists, we drop the field at the specified index.
    if (index === null) {
        // Create a new row with the new field at the given row index,
        targetStepLayout.layout.splice(row, 0, [fieldId]);
        return;
    }

    targetStepLayout.layout[row].splice(index, 0, fieldId);
};

export default (params: MoveFieldBetweenRowsParams) => {
    moveFieldBetweenSteps(params);
    cleanupEmptyRows(params);
};
