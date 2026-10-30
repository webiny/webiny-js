import { Result } from "@webiny/feature/api";
import {
    DeleteRemoteComponentUseCase as UseCaseAbstraction,
    DeleteRemoteComponentRepository
} from "./abstractions.js";
import { RemoteComponentPermissions } from "~/api/features/permissions/abstractions.js";
import { RemoteComponentNotAuthorizedError } from "~/api/domain/errors.js";

class DeleteRemoteComponentUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: RemoteComponentPermissions.Interface,
        private repository: DeleteRemoteComponentRepository.Interface
    ) {}

    async execute(id: string) {
        const canDelete = await this.permissions.canDelete("component");
        if (!canDelete) {
            return Result.fail(new RemoteComponentNotAuthorizedError());
        }

        return this.repository.execute(id);
    }
}

export const DeleteRemoteComponentUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteRemoteComponentUseCaseImpl,
    dependencies: [RemoteComponentPermissions, DeleteRemoteComponentRepository]
});
