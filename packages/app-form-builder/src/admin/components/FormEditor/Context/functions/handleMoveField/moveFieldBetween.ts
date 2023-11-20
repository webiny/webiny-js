import {
    FbFormModel,
    FbFormModelField,
    FbFormStep,
    DropTarget,
    DropDestination,
    DropSource
} from "~/types";
import getFieldPosition from "./getFieldPosition";

/**
 * Remove all rows that have zero fields in it.
 * @param data
 */

interface MoveFieldBetweenParams {
    data: FbFormModel;
    field: FbFormModelField | string;
    target: DropTarget;
    destination: DropDestination;
    source: DropSource;
}

const cleanupEmptyRows = (params: MoveFieldBetweenParams): void => {
    const { data, destination, source } = params;
    const sourceContainerLayout = data.steps.find(
        step => step.id === source.containerId
    ) as FbFormStep;
    const destinationContainerLayout = data.steps.find(
        step => step.id === destination.containerId
    ) as FbFormStep;

    if (sourceContainerLayout) {
        sourceContainerLayout.layout = sourceContainerLayout?.layout.filter(row => row.length > 0);
    }

    destinationContainerLayout.layout = destinationContainerLayout.layout.filter(
        row => row.length > 0
    );
};

const moveFieldBetween = (params: MoveFieldBetweenParams) => {
    const { data, field, destination, source } = params;
    const fieldId = typeof field === "string" ? field : field._id;

    if (!fieldId) {
        console.log("Missing data when moving field.");
        console.log(params);
        return;
    }

    const sourceContainerLayout = data.steps.find(
        step => step.id === source.containerId
    ) as FbFormStep;
    const destinationContainerLayout = data.steps.find(
        step => step.id === destination.containerId
    ) as FbFormStep;

    const existingPosition = getFieldPosition({
        field: fieldId,
        data: sourceContainerLayout || destinationContainerLayout
    });

    if (existingPosition) {
        sourceContainerLayout.layout[existingPosition.row].splice(existingPosition.index, 1);
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
};

export default (params: MoveFieldBetweenParams) => {
    moveFieldBetween(params);
    cleanupEmptyRows(params);
};
