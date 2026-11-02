import type { Container } from "@webiny/di";
import { TakeOverReviewStepUseCase } from "@webiny/api-workflows/features/review/TakeOverReviewStep/index.js";
import { engineCalls } from "./engineCalls.js";

class CountingTakeOverReviewStep implements TakeOverReviewStepUseCase.Interface {
    public constructor(private decoratee: TakeOverReviewStepUseCase.Interface) {}

    public async execute(input: TakeOverReviewStepUseCase.Input): TakeOverReviewStepUseCase.Return {
        engineCalls.push("TakeOverReviewStep");
        return this.decoratee.execute(input);
    }
}

/** Records every `TakeOverReviewStepUseCase` call in `engineCalls` as "TakeOverReviewStep". */
export const countTakeOverReviewStepCalls = (container: Container): void => {
    container.registerDecorator(
        TakeOverReviewStepUseCase.createDecorator({
            decorator: CountingTakeOverReviewStep,
            dependencies: []
        })
    );
};
