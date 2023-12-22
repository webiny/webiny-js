import { useCallback } from "react";
import { FbFormStep, MoveStepParams } from "~/types";
import {
    DragObjectWithFieldInfo,
    IsVisibleCallableParams
} from "~/admin/components/FormEditor/Droppable";
import { useFormEditor } from "~/admin/components/FormEditor/Context";

export const useEditTab = () => {
    const { data, moveStep, addStep } = useFormEditor();

    const handleStepMove = useCallback(
        (item: DragObjectWithFieldInfo, formStep: FbFormStep) => {
            if (item.pos) {
                if (item.pos.index === null) {
                    return;
                }
            }

            const moveStepParams: MoveStepParams = {
                source: {
                    containerId: item.container?.id || "",
                    position: item.pos
                },
                destination: {
                    containerId: formStep.id
                }
            };

            moveStep(moveStepParams);

            return undefined;
        },
        [data]
    );

    // This function will render drop zones on the top of the step,
    // if steps are located above "source" ("source" step is the step that we move).
    const renderTopDropZone = useCallback(
        (item: IsVisibleCallableParams, targetStepId: string) => {
            if (item.ui !== "step") {
                return false;
            }

            if (!item.container?.id) {
                return false;
            }

            const stepsIds = data.steps.reduce(
                (prevVal, currVal) => [...prevVal, currVal.id],
                [] as string[]
            );

            return stepsIds.slice(0, stepsIds.indexOf(item.container?.id)).includes(targetStepId);
        },
        [data]
    );

    // This function will render drop zones on the bottom of the step,
    // if steps are located below "source" ("source" step is the step that we move).
    const renderBottomDropZone = useCallback(
        (item: IsVisibleCallableParams, targetStepId: string) => {
            if (item.ui !== "step") {
                return false;
            }

            if (!item.container?.id) {
                return false;
            }

            const stepsIds = data.steps.reduce(
                (prevVal, currVal) => [...prevVal, currVal.id],
                [] as string[]
            );

            return stepsIds.slice(stepsIds.indexOf(item.container?.id)).includes(targetStepId);
        },
        [data]
    );

    const isAddStepVisible = useCallback(
        (formStep: FbFormStep) => {
            return data.steps[data.steps.length - 1].id === formStep.id;
        },
        [data]
    );

    return {
        handleStepMove,
        renderTopDropZone,
        renderBottomDropZone,
        isAddStepVisible,
        addStep
    };
};
