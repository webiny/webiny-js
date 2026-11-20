import { Result } from "@webiny/feature/api";
import { GetLayoutRepository, GetLayoutUseCase as UseCaseAbstraction } from "./abstractions.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { LayoutNotAuthorizedError } from "~/domain/layout/errors.js";

class GetLayoutUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private repository: GetLayoutRepository.Interface
    ) {}

    async execute(id: string): UseCaseAbstraction.Return {
        // A layout is rendered around pages, so reading it takes the page permission.
        const hasPermission = await this.permissions.canRead("page");
        if (!hasPermission) {
            return Result.fail(new LayoutNotAuthorizedError());
        }

        const result = await this.repository.execute(id);
        if (result.isFail()) {
            return result;
        }

        const canAccess = await this.permissions.canAccess("page", result.value);
        if (!canAccess) {
            return Result.fail(new LayoutNotAuthorizedError());
        }

        return result;
    }
}

export const GetLayoutUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetLayoutUseCaseImpl,
    dependencies: [WbPermissions, GetLayoutRepository]
});
