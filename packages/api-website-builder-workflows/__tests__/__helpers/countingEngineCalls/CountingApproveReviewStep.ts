import type { Container } from "@webiny/di";
import { ApproveReviewStepUseCase } from "@webiny/api-workflows/features/review/ApproveReviewStep/index.js";
import { engineCalls } from "./engineCalls.js";

class CountingApproveReviewStep implements ApproveReviewStepUseCase.Interface {
    public constructor(private decoratee: ApproveReviewStepUseCase.Interface) {}

    public async execute(input: ApproveReviewStepUseCase.Input): ApproveReviewStepUseCase.Return {
        engineCalls.push("ApproveReviewStep");
        return this.decoratee.execute(input);
    }
}

/** Records every `ApproveReviewStepUseCase` call in `engineCalls` as "ApproveReviewStep". */
export const countApproveReviewStepCalls = (container: Container): void => {
    container.registerDecorator(
        ApproveReviewStepUseCase.createDecorator({
            decorator: CountingApproveReviewStep,
            dependencies: []
        })
    );
};
