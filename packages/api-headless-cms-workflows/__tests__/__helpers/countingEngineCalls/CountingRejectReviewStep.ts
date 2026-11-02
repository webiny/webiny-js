import type { Container } from "@webiny/di";
import { RejectReviewStepUseCase } from "@webiny/api-workflows/features/review/RejectReviewStep/index.js";
import { engineCalls } from "./engineCalls.js";

class CountingRejectReviewStep implements RejectReviewStepUseCase.Interface {
    public constructor(private decoratee: RejectReviewStepUseCase.Interface) {}

    public async execute(input: RejectReviewStepUseCase.Input): RejectReviewStepUseCase.Return {
        engineCalls.push("RejectReviewStep");
        return this.decoratee.execute(input);
    }
}

/** Records every `RejectReviewStepUseCase` call in `engineCalls` as "RejectReviewStep". */
export const countRejectReviewStepCalls = (container: Container): void => {
    container.registerDecorator(
        RejectReviewStepUseCase.createDecorator({
            decorator: CountingRejectReviewStep,
            dependencies: []
        })
    );
};
