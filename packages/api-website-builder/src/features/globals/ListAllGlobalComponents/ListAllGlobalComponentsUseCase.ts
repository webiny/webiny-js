import { Result } from "@webiny/feature/api";
import {
    ListAllGlobalComponentsRepository,
    ListAllGlobalComponentsUseCase as UseCaseAbstraction
} from "./abstractions.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { PageNotAuthorizedError } from "~/domain/page/errors.js";

class ListAllGlobalComponentsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private repository: ListAllGlobalComponentsRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params = {}): UseCaseAbstraction.Return {
        // Global components are part of every page, so reading them takes the same permission.
        const hasPermission = await this.permissions.canRead("page");
        if (!hasPermission) {
            return Result.fail(new PageNotAuthorizedError());
        }

        return this.repository.execute({ scope: params.scope });
    }
}

export const ListAllGlobalComponentsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListAllGlobalComponentsUseCaseImpl,
    dependencies: [WbPermissions, ListAllGlobalComponentsRepository]
});
