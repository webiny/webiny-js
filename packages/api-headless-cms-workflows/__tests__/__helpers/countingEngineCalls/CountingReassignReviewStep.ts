import type { Container } from "@webiny/di";
import { ReassignReviewStepUseCase } from "@webiny/api-workflows/features/review/ReassignReviewStep/index.js";
import { engineCalls } from "./engineCalls.js";

class CountingReassignReviewStep implements ReassignReviewStepUseCase.Interface {
    public constructor(private decoratee: ReassignReviewStepUseCase.Interface) {}

    public async execute(input: ReassignReviewStepUseCase.Input): ReassignReviewStepUseCase.Return {
        engineCalls.push("ReassignReviewStep");
        return this.decoratee.execute(input);
    }
}

/** Records every `ReassignReviewStepUseCase` call in `engineCalls` as "ReassignReviewStep". */
export const countReassignReviewStepCalls = (container: Container): void => {
    container.registerDecorator(
        ReassignReviewStepUseCase.createDecorator({
            decorator: CountingReassignReviewStep,
            dependencies: []
        })
    );
};
