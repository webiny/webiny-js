import { FbFormStep, MoveStepParams } from "~/types";

interface MoveStep extends MoveStepParams {
    data: FbFormStep[];
}

const moveStep = (params: MoveStep) => {
    const { target, destination, data } = params;

    /* targetStep is the step that is being dragged */
    const targetStep = data.find((v: FbFormStep) => v.id === target.containerId);
    const targetStepIndex = data.findIndex((v: FbFormStep) => v.id === target.containerId);

    const destinationStep = data.find((v: FbFormStep) => v.id === destination.containerId);
    const destinationStepIndex = data.findIndex(
        (v: FbFormStep) => v.id === destination.containerId
    );

    data.splice(targetStepIndex, 1, destinationStep as FbFormStep);
    data.splice(destinationStepIndex, 1, targetStep as FbFormStep);
};

export default (params: MoveStep) => {
    moveStep(params);
};
