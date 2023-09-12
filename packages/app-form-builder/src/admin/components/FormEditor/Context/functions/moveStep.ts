import { FbFormStep } from "~/types";

interface MoveStepParams {
    data: FbFormStep[];
    /* formStep is the step that we are dragging */
    formStep: FbFormStep;
    step: FbFormStep;
}

const moveStep = (params: MoveStepParams) => {
    const { step, data, formStep } = params;

    /* step1 is the step that will change it's position with */
    const step1 = data.findIndex((v: FbFormStep) => v.id === step.id);
    /* step2 is the step that is being dragged */
    const step2 = data.findIndex((v: FbFormStep) => v.id === formStep.id);

    data.splice(step1, 1, formStep);
    data.splice(step2, 1, step);
};

export default (params: any) => {
    moveStep(params);
};
