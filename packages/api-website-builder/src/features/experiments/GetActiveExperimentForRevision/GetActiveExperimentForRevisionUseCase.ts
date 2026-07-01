import { Result } from "@webiny/feature/api";
import {
    GetActiveExperimentForRevisionUseCase as UseCaseAbstraction,
    GetActiveExperimentForRevisionRepository
} from "./abstractions.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { ExperimentNotAuthorizedError } from "~/domain/experiment/errors.js";

class GetActiveExperimentForRevisionUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private repository: GetActiveExperimentForRevisionRepository.Interface
    ) {}

    async execute(revisionId: string): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canRead("page");
        if (!hasPermission) {
            return Result.fail(new ExperimentNotAuthorizedError());
        }

        return this.repository.execute(revisionId);
    }
}

export const GetActiveExperimentForRevisionUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetActiveExperimentForRevisionUseCaseImpl,
    dependencies: [WbPermissions, GetActiveExperimentForRevisionRepository]
});
