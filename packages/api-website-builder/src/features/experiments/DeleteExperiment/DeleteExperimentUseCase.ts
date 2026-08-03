import { Result } from "@webiny/feature/api";
import { DeleteExperimentUseCase as UseCaseAbstraction } from "./abstractions/DeleteExperimentUseCase.js";
import { DeleteExperimentRepository } from "./abstractions/DeleteExperimentRepository.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { ExperimentNotAuthorizedError } from "~/domain/experiment/errors.js";

class DeleteExperimentUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private repository: DeleteExperimentRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canDelete("page");
        if (!hasPermission) {
            return Result.fail(new ExperimentNotAuthorizedError());
        }

        return this.repository.execute(params);
    }
}

export const DeleteExperimentUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteExperimentUseCaseImpl,
    dependencies: [WbPermissions, DeleteExperimentRepository]
});
