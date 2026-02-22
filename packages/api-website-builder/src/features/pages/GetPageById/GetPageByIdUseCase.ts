import { Result } from "@webiny/feature/api";
import { GetPageByIdUseCase as UseCaseAbstraction, GetPageByIdRepository } from "./abstractions.js";
import { WbPermissions } from "~/domain/permissions.js";
import { PageNotAuthorizedError } from "~/domain/page/errors.js";

class GetPageByIdUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private repository: GetPageByIdRepository.Interface
    ) {}

    async execute(id: string): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canRead("page");
        if (!hasPermission) {
            return Result.fail(new PageNotAuthorizedError());
        }

        const result = await this.repository.execute(id);

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

export const GetPageByIdUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetPageByIdUseCaseImpl,
    dependencies: [WbPermissions.Abstraction, GetPageByIdRepository]
});
