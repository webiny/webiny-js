import { FbFormStep, StepLayoutPositionType } from "~/types";

interface MoveStepParams {
    step: FbFormStep;
    position: StepLayoutPositionType;
    data: FbFormStep[];
}

const moveStep = (params: MoveStepParams) => {
    const { step, position, data } = params;

    const step1 = data.findIndex((v: FbFormStep) => v.id === step.id);
    const step2 = data.findIndex((v: FbFormStep) => v.id === position.row.id);

    data.splice(step1, 1, position.row);
    data.splice(step2, 1, step);
};

export default (params: any) => {
    moveStep(params);
};
