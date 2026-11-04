import { Result } from "@webiny/feature/api";
import {
    GetGlobalComponentRepository,
    GetGlobalComponentUseCase as UseCaseAbstraction
} from "./abstractions.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { PageNotAuthorizedError } from "~/domain/page/errors.js";
import { GlobalComponentLanguage } from "~/domain/globals/GlobalComponentLanguage.js";

class GetGlobalComponentUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private repository: GetGlobalComponentRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        // Global components are part of every page, so reading them takes the same permission.
        const hasPermission = await this.permissions.canRead("page");
        if (!hasPermission) {
            return Result.fail(new PageNotAuthorizedError());
        }

        return this.repository.execute({
            name: params.name,
            language: GlobalComponentLanguage.from(params.language).toString()
        });
    }
}

export const GetGlobalComponentUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetGlobalComponentUseCaseImpl,
    dependencies: [WbPermissions, GetGlobalComponentRepository]
});
