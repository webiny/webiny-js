import { FbFormModel, FbFormModelField, DropTarget, DropDestination, DropSource } from "~/types";
import getFieldPosition from "./getFieldPosition";
import { getContainerLayout } from "../index";

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
/*
    The difference between moving field between steps, step and condition group or between two condition groups:
    * When we move field between steps we are going to change property "layout" of those steps;
    * When we move field between step and condition group we are going to change property "layout" of step 
      and the property "layout" that is being stored inside of the Condition Group settings;
    * When we move field between condition groups we are going to change property "layout" of those condition groups and we don't need information about steps in which
      those condition groups are being stored, because we are not affecting layout of steps in this case.
*/
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
