import { Result } from "@webiny/feature/api";
import {
    ListExperimentsUseCase as UseCaseAbstraction,
    ListExperimentsRepository
} from "./abstractions.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { ExperimentNotAuthorizedError } from "~/domain/experiment/errors.js";

class ListExperimentsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private repository: ListExperimentsRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canRead("page");
        if (!hasPermission) {
            return Result.fail(new ExperimentNotAuthorizedError());
        }

        return this.repository.execute(params);
    }
}

export const ListExperimentsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListExperimentsUseCaseImpl,
    dependencies: [WbPermissions, ListExperimentsRepository]
});
