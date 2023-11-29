import { useCallback, useState } from "react";
import { DropDestination, DropSource, DropTarget, FbFormModelField, FbFormStep } from "~/types";
import { useFormEditor } from "~/admin/components/FormEditor";
import { DragObjectWithFieldInfo } from "~/admin/components/FormEditor/Droppable";
import cloneDeep from "lodash/cloneDeep";

interface HandleDropParams {
    target: DropTarget;
    source: DropSource;
    destination: DropDestination;
}

interface CreateCustomFieldParams {
    data: FbFormModelField;
    dropDestination: DropDestination;
}

interface ComposeHandleDropParams {
    item: DragObjectWithFieldInfo;
    destinationPosition: DropDestination["position"];
    formStep: FbFormStep;
}

export const useFormStep = () => {
    const [editingField, setEditingField] = useState<FbFormModelField | null>(null);
    const [dropDestination, setDropDestination] = useState<DropDestination | null>(null);

    const { data, moveRow, moveField, getFieldPlugin, insertField } = useFormEditor();

    const editField = useCallback((field: FbFormModelField | null) => {
        if (!field) {
            setEditingField(null);
            return;
        }
        setEditingField(cloneDeep(field));
    }, []);

    const handleDrop = useCallback(
        (params: HandleDropParams) => {
            const { target, source, destination } = params;

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
                const sourceContainer = data.steps.find(step => step.id === source.containerId);
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
                destination
            });
        },
        [data]
    );

    const onFormStepDrop = (params: ComposeHandleDropParams) => {
        const { item, formStep, destinationPosition } = params;

        // We don't want to drop steps inside of steps.
        if (item.ui === "step") {
            return undefined;
        }

        handleDrop({
            target: {
                type: item.ui,
                id: item.id,
                name: item.name
            },
            source: {
                containerId: item?.container?.id,
                containerType: item?.container?.type,
                position: item.pos
            },
            destination: {
                containerId: formStep.id,
                containerType: "step",
                position: destinationPosition
            }
        });

        return undefined;
    };

    const createCustomField = (params: CreateCustomFieldParams) => {
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
    };

    return {
        editField,
        editingField,
        dropDestination,
        onFormStepDrop,
        createCustomField
    };
};
