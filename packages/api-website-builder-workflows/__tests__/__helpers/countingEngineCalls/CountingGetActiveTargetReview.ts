import type { Container } from "@webiny/di";
import { GetActiveTargetReviewUseCase } from "@webiny/api-workflows/features/review/GetActiveTargetReview/index.js";
import { engineCalls } from "./engineCalls.js";

class CountingGetActiveTargetReview implements GetActiveTargetReviewUseCase.Interface {
    public constructor(private decoratee: GetActiveTargetReviewUseCase.Interface) {}

    public async execute(
        input: GetActiveTargetReviewUseCase.Input
    ): GetActiveTargetReviewUseCase.Return {
        engineCalls.push("GetActiveTargetReview");
        return this.decoratee.execute(input);
    }
}

/** Records every `GetActiveTargetReviewUseCase` call in `engineCalls` as "GetActiveTargetReview". */
export const countGetActiveTargetReviewCalls = (container: Container): void => {
    container.registerDecorator(
        GetActiveTargetReviewUseCase.createDecorator({
            decorator: CountingGetActiveTargetReview,
            dependencies: []
        })
    );
};
