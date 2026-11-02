import type { Container } from "@webiny/di";
import { ListReviewsUseCase } from "@webiny/api-workflows/features/review/ListReviews/index.js";
import { engineCalls } from "./engineCalls.js";

class CountingListReviews implements ListReviewsUseCase.Interface {
    public constructor(private decoratee: ListReviewsUseCase.Interface) {}

    public async execute(input: ListReviewsUseCase.Input): ListReviewsUseCase.Return {
        engineCalls.push("ListReviews");
        return this.decoratee.execute(input);
    }
}

/** Records every `ListReviewsUseCase` call in `engineCalls` as "ListReviews". */
export const countListReviewsCalls = (container: Container): void => {
    container.registerDecorator(
        ListReviewsUseCase.createDecorator({ decorator: CountingListReviews, dependencies: [] })
    );
};
