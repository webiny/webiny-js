import { FbFormStep, MoveStepParams } from "~/types";
import { DragObjectWithFieldInfo, IsVisibleCallableParams } from "../../../Droppable";
import { useFormEditor } from "../../../Context";

export const useEditTab = () => {
    const { data, moveStep, addStep } = useFormEditor();

    const handleStepMove = (item: DragObjectWithFieldInfo, formStep: FbFormStep) => {
        if (item.pos) {
            if (item.pos.index === null) {
                return;
            }
        }

        const moveStepParams: MoveStepParams = {
            target: {
                containerId: item.container?.id || "",
                position: item.pos
            },
            destination: {
                containerId: formStep.id
            }
        };

        moveStep(moveStepParams);

        return undefined;
    };

    // This function will render drop zones on the top of the step,
    // if steps are locatted above "source" ("source" step is the step that we move).
    const renderTopDropZone = (item: IsVisibleCallableParams, targetStepId: string) => {
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
    };

    // This function will render drop zones on the top of the step,
    // if steps are locatted below "source" ("source" step is the step that we move).
    const renderBottomDropZone = (item: IsVisibleCallableParams, targetStepId: string) => {
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
    };

    const isAddStepVisible = (formStep: FbFormStep) => {
        return data.steps[data.steps.length - 1].id === formStep.id;
    };

    return {
        handleStepMove,
        renderTopDropZone,
        renderBottomDropZone,
        isAddStepVisible,
        addStep
    };
};
