import { Result } from "@webiny/feature/api";
import { ListModelsRepository as RepositoryAbstraction } from "./abstractions.js";
import { ModelsFetcher } from "~/features/contentModel/shared/abstractions.js";
import type { CmsModel, ICmsModelListParams } from "~/types/index.js";
import { ModelPersistenceError } from "~/domain/contentModel/errors.js";

/**
 * ListModelsRepository - Fetches all models with optional filters.
 *
 * Responsibilities:
 * - Use ModelsFetcher to get cached models
 * - Apply includePrivate and includePlugins filters
 * - Return all accessible models
 */
class ListModelsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private modelsFetcher: ModelsFetcher.Interface) {}

    async execute(
        params?: ICmsModelListParams
    ): Promise<Result<CmsModel[], RepositoryAbstraction.Error>> {
        // Default params
        const includePrivate = params?.includePrivate !== false; // defaults to true
        const includePlugins = params?.includePlugins !== false; // defaults to true

        const result = await this.modelsFetcher.fetchAll();

        if (result.isFail()) {
            return Result.fail(new ModelPersistenceError(result.error));
        }

        let models = result.value;

        // Filter out plugin models if requested
        if (!includePlugins) {
            models = models.filter(model => !model.isPlugin);
        }

        // Filter out private models if requested
        if (!includePrivate) {
            models = models.filter(model => model.isPrivate !== true);
        }

        return Result.ok(models);
    }
}

export const ListModelsRepository = RepositoryAbstraction.createImplementation({
    implementation: ListModelsRepositoryImpl,
    dependencies: [ModelsFetcher]
});
