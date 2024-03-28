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

interface MoveField {
    data: FbFormModel;
    field: FbFormModelField | string;
    target: DropTarget;
    destination: DropDestination;
    /*
        We need "source" in case we are moving fields between condition group and step in scope of ONE STEP.
    */
    source?: DropSource;
}

const cleanupEmptyRows = ({ destination, data }: MoveField): void => {
    const destinationLayout =
        destination.containerType === "conditionGroup"
            ? data.fields.find(f => f._id === destination.containerId)?.settings
            : data.steps.find(step => step.id === destination.containerId);

    if (destinationLayout) {
        destinationLayout.layout = destinationLayout?.layout.filter(
            (row: string[][]) => row.length > 0
        );
    }
};

const moveField = (params: MoveField) => {
    const { data, field, destination } = params;
    const destinationContainerLayout = data.steps.find(
        step => step.id === destination.containerId
    ) as FbFormStep;
    const fieldId = typeof field === "string" ? field : field._id;
    if (!fieldId) {
        console.log("Missing data when moving field.");
        return;
    }
    if (destination.containerType === "conditionGroup") {
        const destinationLayout = data.fields.find(f => f._id === destination.containerId);

        if (destinationLayout?.settings.layout) {
            destinationLayout.settings.layout = destinationLayout?.settings.layout.filter(
                (row: any) => Boolean(row)
            );

            const existingFieldPosition = getFieldPosition({
                field: fieldId,
                layout: destinationLayout.settings.layout
            });

            if (existingFieldPosition) {
                destinationLayout.settings.layout[existingFieldPosition.row].splice(
                    existingFieldPosition.index,
                    1
                );
            }

            // Setting a form field into a new non-existing row.
            if (!destinationLayout.settings.layout[destination.position.row]) {
                destinationLayout.settings.layout[destination.position.row] = [fieldId];
                return;
            }

            // If row exists, we drop the field at the specified index.
            if (destination.position.index === null) {
                // Create a new row with the new field at the given row index.
                destinationLayout.settings.layout.splice(destination.position.row, 0, [fieldId]);
                return;
            }

            destinationLayout.settings.layout[destination.position.row].splice(
                destination.position.index,
                0,
                fieldId
            );
        }
    }

    if (destinationContainerLayout) {
        destinationContainerLayout.layout = destinationContainerLayout?.layout.filter(row =>
            Boolean(row)
        );

        const existingFieldPosition = getFieldPosition({
            field: fieldId,
            layout: destinationContainerLayout.layout
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
