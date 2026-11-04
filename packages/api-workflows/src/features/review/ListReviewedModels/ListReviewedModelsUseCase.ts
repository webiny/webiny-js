import { Result } from "@webiny/feature/api";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ListReviewedModelsUseCase as ListReviewedModelsUseCaseAbstraction } from "./abstractions.js";

/**
 * Registered per request (`inContainerScope`), so the cache lives for one request. Only a
 * successful read is cached; a failed one is read again on the next call.
 */
class ListReviewedModelsUseCaseImpl implements ListReviewedModelsUseCaseAbstraction.Interface {
    private models: string[] | null = null;

    public constructor(private repository: ReviewRepository.Interface) {}

    public async execute(): ListReviewedModelsUseCaseAbstraction.Return {
        if (this.models) {
            return Result.ok([...this.models]);
        }
        const result = await this.repository.listReviewedModels();
        if (result.isFail()) {
            return Result.fail(result.error);
        }
        this.models = result.value;
        return Result.ok([...result.value]);
    }
}

export const ListReviewedModelsUseCase = ListReviewedModelsUseCaseAbstraction.createImplementation({
    implementation: ListReviewedModelsUseCaseImpl,
    dependencies: [ReviewRepository]
});
