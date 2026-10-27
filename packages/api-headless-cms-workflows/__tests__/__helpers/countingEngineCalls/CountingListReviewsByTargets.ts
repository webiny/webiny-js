import type { Container } from "@webiny/di";
import { ListReviewsByTargetsUseCase } from "@webiny/api-workflows/features/review/ListReviewsByTargets/index.js";
import { engineCalls } from "./engineCalls.js";

class CountingListReviewsByTargets implements ListReviewsByTargetsUseCase.Interface {
    public constructor(private decoratee: ListReviewsByTargetsUseCase.Interface) {}

    public async execute(
        input: ListReviewsByTargetsUseCase.Input
    ): ListReviewsByTargetsUseCase.Return {
        engineCalls.push("ListReviewsByTargets");
        return this.decoratee.execute(input);
    }
}

/** Records every `ListReviewsByTargetsUseCase` call in `engineCalls` as "ListReviewsByTargets". */
export const countListReviewsByTargetsCalls = (container: Container): void => {
    container.registerDecorator(
        ListReviewsByTargetsUseCase.createDecorator({
            decorator: CountingListReviewsByTargets,
            dependencies: []
        })
    );
};
