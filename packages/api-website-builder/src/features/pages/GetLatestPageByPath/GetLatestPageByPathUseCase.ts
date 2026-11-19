import { Result } from "@webiny/feature/api";
import { GetLatestPageByPathUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetLatestPageByPathRepository } from "./abstractions.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { PageNotAuthorizedError } from "~/domain/page/errors.js";

class GetLatestPageByPathUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private repository: GetLatestPageByPathRepository.Interface
    ) {}

    async execute(path: string): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canRead("page");
        if (!hasPermission) {
            return Result.fail(new PageNotAuthorizedError());
        }

        const result = await this.repository.execute(path);

        if (result.isFail()) {
            return result;
        }

        const canAccess = await this.permissions.canAccess("page", result.value);
        if (!canAccess) {
            return Result.fail(new PageNotAuthorizedError());
        }

        return result;
    }
}

export const GetLatestPageByPathUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetLatestPageByPathUseCaseImpl,
    dependencies: [WbPermissions, GetLatestPageByPathRepository]
});
