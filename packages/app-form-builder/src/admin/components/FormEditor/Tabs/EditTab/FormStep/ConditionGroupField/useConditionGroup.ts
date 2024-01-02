import { useCallback, useContext } from "react";
import { useFormEditor } from "~/admin/components/FormEditor/Context";
import { DragObjectWithFieldInfo } from "~/admin/components/FormEditor/Droppable";
import { DropDestination, DropPosition, DropSource, DropTarget, FbFormModelField } from "~/types";
import { FormStepContext } from "../FormStepContext/FormStepContext";
import { useFormStep } from "../useFormStep";

interface HandleDropParams {
    item: DragObjectWithFieldInfo;
    destinationPosition: DropPosition;
    conditionGroup: FbFormModelField;
}

export const useConditionGroup = () => {
    const { data, moveRow, moveField, getFieldPlugin, insertField } = useFormEditor();
    const { editField } = useFormStep();

    const { setDropDestination } = useContext(FormStepContext);

    const handleDrop = useCallback(
        (params: HandleDropParams) => {
            const { item, conditionGroup, destinationPosition } = params;

            const target: DropTarget = {
                type: item.ui,
                id: item.id,
                name: item.name
            };

            const source: DropSource = {
                containerId: item?.container?.id,
                containerType: item?.container?.type,
                position: item.pos
            };

            const destination: DropDestination = {
                containerId: conditionGroup._id,
                containerType: "conditionGroup",
                position: destinationPosition
            };

            if (target.name === "custom") {
                // We can cast because field is empty in the start.
                editField({} as FbFormModelField);
                setDropDestination(destination);
                return;
            }

            if (target.type === "row") {
                // Reorder rows.
                // Reorder logic is different depending on the source and destination position.
                // "source" is a container from which we move row.
                // "destination" is a container in which we move row.
                moveRow(source.position.row, destination.position.row, source, destination);
                return;
            }

            if (source.position) {
                if (source.position.index === null) {
                    console.log("Tried to move Form Field but its position index is null.");
                    console.log(source);
                    return;
                }
                const sourceContainer =
                    source.containerType === "conditionGroup"
                        ? data.fields.find(f => f._id === source.containerId)?.settings
                        : data.steps.find(step => step.id === source.containerId);
                const fieldId = sourceContainer?.layout[source.position.row][source.position.index];
                if (!fieldId) {
                    console.log("Missing data when moving field.");
                    return;
                }
                moveField({ field: fieldId, target, source, destination });
                return;
            }

            // Find field plugin which handles the dropped field type "name".
            const plugin = getFieldPlugin({ name: target.name });
            if (!plugin) {
                return;
            }
            insertField({
                data: plugin.field.createField(),
                target,
                source,
                destination
            });

            return undefined;
        },
        [data]
    );

    return {
        handleDrop,
        editField
    };
};
