import { Result } from "@webiny/feature/api";
import { GetModelUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetModelRepository } from "./abstractions.js";
import { AccessControl } from "~/features/shared/abstractions.js";
import type { CmsModel } from "~/types/index.js";
import { ModelNotAuthorizedError } from "~/domain/contentModel/errors.js";

/**
 * GetModelUseCase - Retrieves a single content model by ID.
 *
 * Responsibilities:
 * - Apply initial access control check
 * - Delegate to repository (which uses ModelCache for plugin + DB models)
 * - Apply model-specific access control check
 * - Return the model or appropriate error
 */
class GetModelUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private repository: GetModelRepository.Interface,
        private accessControl: AccessControl.Interface
    ) {}

    async execute(modelId: string): Promise<Result<CmsModel, UseCaseAbstraction.Error>> {
        const result = await this.repository.execute(modelId);

        if (result.isFail()) {
            return result;
        }

        const model = result.value;

        // Model-specific access control check
        const canAccessModel = await this.accessControl.canAccessModel({ model, rwd: "r" });
        if (!canAccessModel) {
            return Result.fail(ModelNotAuthorizedError.fromModel(model));
        }

        return Result.ok(model);
    }
}

export const GetModelUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetModelUseCaseImpl,
    dependencies: [GetModelRepository, AccessControl]
});
