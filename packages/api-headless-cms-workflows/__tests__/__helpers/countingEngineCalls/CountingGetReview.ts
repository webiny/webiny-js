import type { Container } from "@webiny/di";
import { GetReviewUseCase } from "@webiny/api-workflows/features/review/GetReview/index.js";
import { engineCalls } from "./engineCalls.js";

class CountingGetReview implements GetReviewUseCase.Interface {
    public constructor(private decoratee: GetReviewUseCase.Interface) {}

    public async execute(input: GetReviewUseCase.Input): GetReviewUseCase.Return {
        engineCalls.push("GetReview");
        return this.decoratee.execute(input);
    }
}

/** Records every `GetReviewUseCase` call in `engineCalls` as "GetReview". */
export const countGetReviewCalls = (container: Container): void => {
    container.registerDecorator(
        GetReviewUseCase.createDecorator({ decorator: CountingGetReview, dependencies: [] })
    );
};
