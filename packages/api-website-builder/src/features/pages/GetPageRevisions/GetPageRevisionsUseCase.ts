import { Result } from "@webiny/feature/api";
import {
    GetPageRevisionsUseCase as UseCaseAbstraction,
    GetPageRevisionsRepository
} from "./abstractions.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { PageNotAuthorizedError } from "~/domain/page/errors.js";

class GetPageRevisionsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private repository: GetPageRevisionsRepository.Interface
    ) {}

    async execute(entryId: string): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canRead("page");
        if (!hasPermission) {
            return Result.fail(new PageNotAuthorizedError());
        }

        const result = await this.repository.execute(entryId);

        if (result.isFail()) {
            return result;
        }

        const pages = result.value;
        if (pages.length > 0) {
            const canAccess = await this.permissions.canAccess("page", pages[0]);
            if (!canAccess) {
                return Result.fail(new PageNotAuthorizedError());
            }
        }

        return result;
    }
}

export const GetPageRevisionsUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetPageRevisionsUseCaseImpl,
    dependencies: [WbPermissions, GetPageRevisionsRepository]
});
