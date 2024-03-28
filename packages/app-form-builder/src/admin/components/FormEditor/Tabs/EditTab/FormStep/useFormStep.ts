import { useCallback, useContext } from "react";
import {
    DropDestination,
    DropSource,
    DropTarget,
    FbFormModelField,
    FbFormStep,
    DropPosition
} from "~/types";
import { useFormEditor } from "~/admin/components/FormEditor";
import { DragObjectWithFieldInfo } from "~/admin/components/FormEditor/Droppable";
import cloneDeep from "lodash/cloneDeep";
import { FormStepContext } from "./FormStepContext/FormStepContext";

interface CreateCustomFieldParams {
    data: FbFormModelField;
    dropDestination: DropDestination;
}

interface HandleDropParams {
    item: DragObjectWithFieldInfo;
    destinationPosition: DropPosition;
    formStep: FbFormStep;
}

export const useFormStep = () => {
    const { data, moveRow, moveField, getFieldPlugin, insertField } = useFormEditor();

    const { editingField, dropDestination, setEditingField, setDropDestination } =
        useContext(FormStepContext);

    const editField = useCallback(
        (field: FbFormModelField | null) => {
            if (!field) {
                setEditingField(null);
                return;
            }
            setEditingField(cloneDeep(field));
        },
        [editingField]
    );

    const handleDrop = useCallback(
        (params: HandleDropParams) => {
            const { item, formStep, destinationPosition } = params;

            // We don't want to drop steps inside of steps.
            if (item.ui === "step") {
                return undefined;
            }

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
                containerId: formStep.id,
                containerType: "step",
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

    const createCustomField = useCallback(
        (params: CreateCustomFieldParams) => {
            const { data, dropDestination } = params;

            insertField({
                data,
                target: {
                    id: data._id,
                    type: "field",
                    name: data.name
                },
                destination: {
                    containerType: dropDestination.containerType,
                    containerId: dropDestination.containerId,
                    position: dropDestination.position
                }
            });
        },
        [editingField, dropDestination]
    );

    return {
        editingField,
        dropDestination,
        editField,
        createCustomField,
        handleDrop
    };
};
