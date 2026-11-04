import type { Container } from "@webiny/di";
import { RequestReviewUseCase } from "@webiny/api-workflows/features/review/RequestReview/index.js";
import { engineCalls } from "./engineCalls.js";

class CountingRequestReview implements RequestReviewUseCase.Interface {
    public constructor(private decoratee: RequestReviewUseCase.Interface) {}

    public async execute(input: RequestReviewUseCase.Input): RequestReviewUseCase.Return {
        engineCalls.push("RequestReview");
        return this.decoratee.execute(input);
    }
}

/** Records every `RequestReviewUseCase` call in `engineCalls` as "RequestReview". */
export const countRequestReviewCalls = (container: Container): void => {
    container.registerDecorator(
        RequestReviewUseCase.createDecorator({ decorator: CountingRequestReview, dependencies: [] })
    );
};
