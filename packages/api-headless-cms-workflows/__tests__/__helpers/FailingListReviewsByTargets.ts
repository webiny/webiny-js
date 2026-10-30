import { Result } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { ListReviewsByTargetsUseCase } from "@webiny/api-workflows/features/review/ListReviewsByTargets/index.js";
import { ReviewPersistenceError } from "@webiny/api-workflows/domain/review/errors.js";

class FailingListReviewsByTargets implements ListReviewsByTargetsUseCase.Interface {
    public constructor(private decoratee: ListReviewsByTargetsUseCase.Interface) {}

    public async execute(): ListReviewsByTargetsUseCase.Return {
        return Result.fail(new ReviewPersistenceError(new Error("Storage is down.")));
    }
}

/** The review list of many targets fails (`legacyPlugins`). */
export const failListReviewsByTargets = (container: Container) => {
    container.registerDecorator(
        ListReviewsByTargetsUseCase.createDecorator({
            decorator: FailingListReviewsByTargets,
            dependencies: []
        })
    );
};
