import type { ReviewListPage } from "~/review/domain/ReviewListPage.js";
import { ReviewRepository } from "~/review/repository/abstractions.js";
import { ListReviewsUseCase as UseCaseAbstraction } from "./abstractions.js";

class ListReviewsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ReviewRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): Promise<ReviewListPage> {
        return this.repository.listReviews(params);
    }
}

export const ListReviewsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListReviewsUseCaseImpl,
    dependencies: [ReviewRepository]
});
