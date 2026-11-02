import type { Container } from "@webiny/di";
import { GetReviewStepRunUseCase } from "@webiny/api-workflows/features/stepRun/GetReviewStepRun/index.js";
import { engineCalls } from "./engineCalls.js";

class CountingGetReviewStepRun implements GetReviewStepRunUseCase.Interface {
    public constructor(private decoratee: GetReviewStepRunUseCase.Interface) {}

    public async execute(input: GetReviewStepRunUseCase.Input): GetReviewStepRunUseCase.Return {
        engineCalls.push("GetReviewStepRun");
        return this.decoratee.execute(input);
    }
}

/** Records every `GetReviewStepRunUseCase` call in `engineCalls` as "GetReviewStepRun". */
export const countGetReviewStepRunCalls = (container: Container): void => {
    container.registerDecorator(
        GetReviewStepRunUseCase.createDecorator({
            decorator: CountingGetReviewStepRun,
            dependencies: []
        })
    );
};
