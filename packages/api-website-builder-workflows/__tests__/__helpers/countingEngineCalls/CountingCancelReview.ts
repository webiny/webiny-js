import type { Container } from "@webiny/di";
import { CancelReviewUseCase } from "@webiny/api-workflows/features/review/CancelReview/index.js";
import { engineCalls } from "./engineCalls.js";

class CountingCancelReview implements CancelReviewUseCase.Interface {
    public constructor(private decoratee: CancelReviewUseCase.Interface) {}

    public async execute(input: CancelReviewUseCase.Input): CancelReviewUseCase.Return {
        engineCalls.push("CancelReview");
        return this.decoratee.execute(input);
    }
}

/** Records every `CancelReviewUseCase` call in `engineCalls` as "CancelReview". */
export const countCancelReviewCalls = (container: Container): void => {
    container.registerDecorator(
        CancelReviewUseCase.createDecorator({ decorator: CountingCancelReview, dependencies: [] })
    );
};
