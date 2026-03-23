import { Result } from "@webiny/feature/api";
import {
    GetDeletedPageByIdUseCase as UseCaseAbstraction,
    GetDeletedPageByIdRepository
} from "./abstractions.js";
import { WbPermissions } from "~/domain/permissions.js";
import { PageNotAuthorizedError } from "~/domain/page/errors.js";

class GetDeletedPageByIdUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private repository: GetDeletedPageByIdRepository.Interface
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

export const GetDeletedPageByIdUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetDeletedPageByIdUseCaseImpl,
    dependencies: [WbPermissions.Abstraction, GetDeletedPageByIdRepository]
});
