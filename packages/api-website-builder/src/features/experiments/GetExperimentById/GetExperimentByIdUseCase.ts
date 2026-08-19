import { Result } from "@webiny/feature/api";
import { GetExperimentByIdUseCase as UseCaseAbstraction } from "./abstractions/GetExperimentByIdUseCase.js";
import { GetExperimentByIdRepository } from "./abstractions/GetExperimentByIdRepository.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { ExperimentNotAuthorizedError } from "~/domain/experiment/errors.js";

class GetExperimentByIdUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private repository: GetExperimentByIdRepository.Interface
    ) {}

    async execute(id: string): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canRead("page");
        if (!hasPermission) {
            return Result.fail(new ExperimentNotAuthorizedError());
        }

        return this.repository.execute(id);
    }
}

export const GetExperimentByIdUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetExperimentByIdUseCaseImpl,
    dependencies: [WbPermissions, GetExperimentByIdRepository]
});
