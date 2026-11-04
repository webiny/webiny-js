import type { Container } from "@webiny/di";
import { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";
import { engineCalls } from "./engineCalls.js";

class CountingListTargetReviews implements ListTargetReviewsUseCase.Interface {
    public constructor(private decoratee: ListTargetReviewsUseCase.Interface) {}

    public async execute(
        input: Parameters<ListTargetReviewsUseCase.Interface["execute"]>[0]
    ): ListTargetReviewsUseCase.Return {
        engineCalls.push("ListTargetReviews");
        return this.decoratee.execute(input);
    }
}

/** Records every `ListTargetReviewsUseCase` call in `engineCalls` as "ListTargetReviews". */
export const countListTargetReviewsCalls = (container: Container): void => {
    container.registerDecorator(
        ListTargetReviewsUseCase.createDecorator({
            decorator: CountingListTargetReviews,
            dependencies: []
        })
    );
};
