import { FbFormStep, FbFormModel } from "~/types";

interface MoveRowParams {
    source: number;
    destination: number;
    data: FbFormModel;
    targetStepId: string;
    sourceStep: FbFormStep;
}

export default ({ data, source, destination, targetStepId, sourceStep }: MoveRowParams): void => {
    const sourceStepLayout = data.steps.find(step => step.id === sourceStep.id) as FbFormStep;
    const targetStepLayout = data.steps.find(step => step.id === targetStepId) as FbFormStep;

    sourceStepLayout.layout = [
        ...sourceStep.layout.slice(0, source),
        ...sourceStep.layout.slice(source + 1)
    ];
    targetStepLayout.layout.splice(destination, 0, sourceStep?.layout[source] as string[]);
};
