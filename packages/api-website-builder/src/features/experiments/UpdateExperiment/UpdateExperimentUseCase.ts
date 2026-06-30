import { Result } from "@webiny/feature/api";
import {
    UpdateExperimentUseCase as UseCaseAbstraction,
    UpdateExperimentRepository
} from "./abstractions.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { ExperimentNotAuthorizedError } from "~/domain/experiment/errors.js";

class UpdateExperimentUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private repository: UpdateExperimentRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canEdit("experiment");
        if (!hasPermission) {
            return Result.fail(new ExperimentNotAuthorizedError());
        }

        return this.repository.execute(params);
    }
}

export const UpdateExperimentUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateExperimentUseCaseImpl,
    dependencies: [WbPermissions, UpdateExperimentRepository]
});
