import type { Container } from "@webiny/di";
import { CancelTargetReviewsUseCase } from "@webiny/api-workflows/features/review/CancelTargetReviews/index.js";
import { engineCalls } from "./engineCalls.js";

class CountingCancelTargetReviews implements CancelTargetReviewsUseCase.Interface {
    public constructor(private decoratee: CancelTargetReviewsUseCase.Interface) {}

    public async execute(
        input: CancelTargetReviewsUseCase.Input
    ): CancelTargetReviewsUseCase.Return {
        engineCalls.push("CancelTargetReviews");
        return this.decoratee.execute(input);
    }
}

/** Records every `CancelTargetReviewsUseCase` call in `engineCalls` as "CancelTargetReviews". */
export const countCancelTargetReviewsCalls = (container: Container): void => {
    container.registerDecorator(
        CancelTargetReviewsUseCase.createDecorator({
            decorator: CountingCancelTargetReviews,
            dependencies: []
        })
    );
};
