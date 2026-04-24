import { Result } from "@webiny/feature/api";
import {
    GetPageByPathUseCase as UseCaseAbstraction,
    GetPageByPathRepository
} from "./abstractions.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { PageNotAuthorizedError } from "~/domain/page/errors.js";

class GetPageByPathUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private repository: GetPageByPathRepository.Interface
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

export const GetPageByPathUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetPageByPathUseCaseImpl,
    dependencies: [WbPermissions, GetPageByPathRepository]
});
