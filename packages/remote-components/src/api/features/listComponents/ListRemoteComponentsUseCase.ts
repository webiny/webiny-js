import { Result } from "@webiny/feature/api";
import {
    ListRemoteComponentsUseCase as UseCaseAbstraction,
    ListRemoteComponentsRepository
} from "./abstractions.js";
import { RemoteComponentPermissions } from "~/api/features/permissions/abstractions.js";
import { RemoteComponentNotAuthorizedError } from "~/api/domain/errors.js";

class ListRemoteComponentsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: RemoteComponentPermissions.Interface,
        private repository: ListRemoteComponentsRepository.Interface
    ) {}

    async execute() {
        const canRead = await this.permissions.canRead("component");
        if (!canRead) {
            return Result.fail(new RemoteComponentNotAuthorizedError());
        }

        return this.repository.execute();
    }
}

export const ListRemoteComponentsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListRemoteComponentsUseCaseImpl,
    dependencies: [RemoteComponentPermissions, ListRemoteComponentsRepository]
});
