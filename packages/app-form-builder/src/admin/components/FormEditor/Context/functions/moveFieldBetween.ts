import { FbFormModel, FbFormModelField, DropTarget, DropDestination, DropSource } from "~/types";
import { getContainerLayout, getFieldPosition } from "./index";

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

    const {
        sourceContainer: sourceContainerLayout,
        destinationContainer: destinationContainerLayout
    } = getContainerLayout({ data, source, destination });

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

    const {
        sourceContainer: sourceContainerLayout,
        destinationContainer: destinationContainerLayout
    } = getContainerLayout({ data, source, destination });

    const existingPosition = getFieldPosition({
        field: fieldId,
        layout: sourceContainerLayout.layout || destinationContainerLayout.layout
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
