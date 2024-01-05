import { FbFormModel, FbFormModelField, FbFormStep, DropTarget, DropDestination } from "~/types";
import getFieldPosition from "./getFieldPosition";

/**
 * Remove all rows that have zero fields in it.
 * @param data
 */

interface MoveField {
    data: FbFormModel;
    field: FbFormModelField | string;
    target: DropTarget;
    destination: DropDestination;
}

const cleanupEmptyRows = ({ destination, data }: MoveField): void => {
    const targetStep = data.steps.find(s => s.id === destination.containerId) as FbFormStep;

    targetStep.layout = targetStep?.layout.filter(row => row.length > 0);
};

const moveField = ({ data, field, destination }: MoveField) => {
    const destinationContainerLayout = data.steps.find(
        step => step.id === destination.containerId
    ) as FbFormStep;
    const fieldId = typeof field === "string" ? field : field._id;
    if (!fieldId) {
        console.log("Missing data when moving field.");
        return;
    }

    if (destinationContainerLayout) {
        destinationContainerLayout.layout = destinationContainerLayout?.layout.filter(row =>
            Boolean(row)
        );

        const existingFieldPosition = getFieldPosition({
            field: fieldId,
            data: destinationContainerLayout
        });

        if (existingFieldPosition) {
            destinationContainerLayout.layout[existingFieldPosition.row].splice(
                existingFieldPosition.index,
                1
            );
        }

        // Setting a form field into a new non-existing row.
        if (!destinationContainerLayout?.layout[destination.position.row]) {
            destinationContainerLayout.layout[destination.position.row] = [fieldId];
            return;
        }

        // If row exists, we drop the field at the specified index.
        if (destination.position.index === null) {
            // Create a new row with the new field at the given row index.
            destinationContainerLayout.layout.splice(destination.position.row, 0, [fieldId]);
            return;
        }

        destinationContainerLayout.layout[destination.position.row].splice(
            destination.position.index,
            0,
            fieldId
        );
    }
};

export default (params: MoveField) => {
    moveField(params);
    cleanupEmptyRows(params);
};
