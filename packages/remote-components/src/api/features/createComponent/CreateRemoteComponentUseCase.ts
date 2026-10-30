import { Result } from "@webiny/feature/api";
import {
    CreateRemoteComponentUseCase as UseCaseAbstraction,
    CreateRemoteComponentRepository
} from "./abstractions.js";
import { RemoteComponentPermissions } from "~/api/features/permissions/abstractions.js";
import { RemoteComponentNotAuthorizedError } from "~/api/domain/errors.js";

class CreateRemoteComponentUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: RemoteComponentPermissions.Interface,
        private repository: CreateRemoteComponentRepository.Interface
    ) {}

    async execute(input: UseCaseAbstraction.Input) {
        const canCreate = await this.permissions.canCreate("component");
        if (!canCreate) {
            return Result.fail(new RemoteComponentNotAuthorizedError());
        }

        return this.repository.execute(input);
    }
}

export const CreateRemoteComponentUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateRemoteComponentUseCaseImpl,
    dependencies: [RemoteComponentPermissions, CreateRemoteComponentRepository]
});
