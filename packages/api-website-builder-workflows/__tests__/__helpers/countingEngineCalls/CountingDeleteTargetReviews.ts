import type { Container } from "@webiny/di";
import { DeleteTargetReviewsUseCase } from "@webiny/api-workflows/features/review/DeleteTargetReviews/index.js";
import { engineCalls } from "./engineCalls.js";

class CountingDeleteTargetReviews implements DeleteTargetReviewsUseCase.Interface {
    public constructor(private decoratee: DeleteTargetReviewsUseCase.Interface) {}

    public async execute(
        input: DeleteTargetReviewsUseCase.Input
    ): DeleteTargetReviewsUseCase.Return {
        engineCalls.push("DeleteTargetReviews");
        return this.decoratee.execute(input);
    }
}

/** Records every `DeleteTargetReviewsUseCase` call in `engineCalls` as "DeleteTargetReviews". */
export const countDeleteTargetReviewsCalls = (container: Container): void => {
    container.registerDecorator(
        DeleteTargetReviewsUseCase.createDecorator({
            decorator: CountingDeleteTargetReviews,
            dependencies: []
        })
    );
};
