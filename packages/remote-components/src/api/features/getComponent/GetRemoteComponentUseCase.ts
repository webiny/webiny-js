import { Result } from "@webiny/feature/api";
import {
    GetRemoteComponentUseCase as UseCaseAbstraction,
    GetRemoteComponentRepository
} from "./abstractions.js";
import { RemoteComponentPermissions } from "~/api/features/permissions/abstractions.js";
import { RemoteComponentNotAuthorizedError } from "~/api/domain/errors.js";

class GetRemoteComponentUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: RemoteComponentPermissions.Interface,
        private repository: GetRemoteComponentRepository.Interface
    ) {}

    async execute(id: string) {
        const canRead = await this.permissions.canRead("component");
        if (!canRead) {
            return Result.fail(new RemoteComponentNotAuthorizedError());
        }

        return this.repository.execute(id);
    }
}

export const GetRemoteComponentUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetRemoteComponentUseCaseImpl,
    dependencies: [RemoteComponentPermissions, GetRemoteComponentRepository]
});
