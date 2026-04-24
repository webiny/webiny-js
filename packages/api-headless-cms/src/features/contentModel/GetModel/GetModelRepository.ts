import { Result } from "@webiny/feature/api";
import { GetModelRepository as RepositoryAbstraction } from "./abstractions.js";
import { ModelsFetcher } from "~/features/contentModel/shared/abstractions.js";
import { ModelNotFoundError } from "~/domain/contentModel/errors.js";
import type { CmsModel } from "~/types/index.js";

/**
 * GetModelRepository - Fetches a single model by ID.
 *
 * Responsibilities:
 * - Use ModelsFetcher to get cached models
 * - Return the model or NotFoundError
 */
class GetModelRepositoryImpl implements RepositoryAbstraction.Interface {
    public constructor(private modelsFetcher: ModelsFetcher.Interface) {}

    async execute(modelId: string): Promise<Result<CmsModel, RepositoryAbstraction.Error>> {
        const result = await this.modelsFetcher.fetchById(modelId);

        if (result.isFail()) {
            return result;
        }

        const model = result.value;

        if (!model) {
            return Result.fail(new ModelNotFoundError(modelId));
        }

        return Result.ok(model);
    }
}

export const GetModelRepository = RepositoryAbstraction.createImplementation({
    implementation: GetModelRepositoryImpl,
    dependencies: [ModelsFetcher]
});
