import type { Container } from "@webiny/di";
import { StartReviewStepUseCase } from "@webiny/api-workflows/features/review/StartReviewStep/index.js";
import { engineCalls } from "./engineCalls.js";

class CountingStartReviewStep implements StartReviewStepUseCase.Interface {
    public constructor(private decoratee: StartReviewStepUseCase.Interface) {}

    public async execute(input: StartReviewStepUseCase.Input): StartReviewStepUseCase.Return {
        engineCalls.push("StartReviewStep");
        return this.decoratee.execute(input);
    }
}

/** Records every `StartReviewStepUseCase` call in `engineCalls` as "StartReviewStep". */
export const countStartReviewStepCalls = (container: Container): void => {
    container.registerDecorator(
        StartReviewStepUseCase.createDecorator({
            decorator: CountingStartReviewStep,
            dependencies: []
        })
    );
};
