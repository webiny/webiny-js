import type { Container } from "@webiny/di";
import { RestartReviewStepUseCase } from "@webiny/api-workflows/features/review/RestartReviewStep/index.js";
import { engineCalls } from "./engineCalls.js";

class CountingRestartReviewStep implements RestartReviewStepUseCase.Interface {
    public constructor(private decoratee: RestartReviewStepUseCase.Interface) {}

    public async execute(input: RestartReviewStepUseCase.Input): RestartReviewStepUseCase.Return {
        engineCalls.push("RestartReviewStep");
        return this.decoratee.execute(input);
    }
}

/** Records every `RestartReviewStepUseCase` call in `engineCalls` as "RestartReviewStep". */
export const countRestartReviewStepCalls = (container: Container): void => {
    container.registerDecorator(
        RestartReviewStepUseCase.createDecorator({
            decorator: CountingRestartReviewStep,
            dependencies: []
        })
    );
};
