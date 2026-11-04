import type { Container } from "@webiny/di";
import { GetTargetReviewUseCase } from "@webiny/api-workflows/features/review/GetTargetReview/index.js";
import { engineCalls } from "./engineCalls.js";

class CountingGetTargetReview implements GetTargetReviewUseCase.Interface {
    public constructor(private decoratee: GetTargetReviewUseCase.Interface) {}

    public async execute(input: GetTargetReviewUseCase.Input): GetTargetReviewUseCase.Return {
        engineCalls.push("GetTargetReview");
        return this.decoratee.execute(input);
    }
}

/** Records every `GetTargetReviewUseCase` call in `engineCalls` as "GetTargetReview". */
export const countGetTargetReviewCalls = (container: Container): void => {
    container.registerDecorator(
        GetTargetReviewUseCase.createDecorator({
            decorator: CountingGetTargetReview,
            dependencies: []
        })
    );
};
