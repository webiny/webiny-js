import { Result } from "@webiny/feature/api";
import { ListModelsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListModelsRepository } from "./abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import type { CmsModel } from "~/types/index.js";
import type { ICmsModelListParams } from "~/types/index.js";
import { ModelNotAuthorizedError } from "~/domain/contentModel/errors.js";

/**
 * ListModelsUseCase - Retrieves all content models.
 *
 * Responsibilities:
 * - Apply initial access control check
 * - Delegate to repository (which uses ModelCache for plugin + DB models)
 * - Return all accessible models
 */
class ListModelsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private repository: ListModelsRepository.Interface,
        private accessControl: AccessControl.Interface
    ) {}

    async execute(params?: ICmsModelListParams): Promise<Result<CmsModel[], UseCaseAbstraction.Error>> {
        // Initial access control check (no specific model yet)
        const canAccess = await this.accessControl.canAccessModel({ rwd: "r" });
        if (!canAccess) {
            return Result.fail(new ModelNotAuthorizedError());
        }

        // Repository uses ModelCache to fetch all models
        // ModelCache handles merging plugin + database models and access control
        const result = await this.repository.execute(params);

        if (result.isFail()) {
            return result;
        }

        return Result.ok(result.value);
    }
}

export const ListModelsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListModelsUseCaseImpl,
    dependencies: [ListModelsRepository, AccessControl]
});
