import { Result } from "@webiny/feature/api";
import { ListLayoutsRepository, ListLayoutsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { LayoutNotAuthorizedError } from "~/domain/layout/errors.js";

class ListLayoutsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private identityContext: IdentityContext.Interface,
        private repository: ListLayoutsRepository.Interface
    ) {}

    async execute(): UseCaseAbstraction.Return {
        // A layout is rendered around pages, so reading it takes the page permission.
        const hasPermission = await this.permissions.canRead("page");
        if (!hasPermission) {
            return Result.fail(new LayoutNotAuthorizedError());
        }

        const where: ListLayoutsRepository.Where = {};
        if (await this.permissions.onlyOwnRecords("page")) {
            const identity = this.identityContext.getIdentity();
            where.createdBy = identity.id;
        }

        const result = await this.repository.execute(where);
        if (result.isFail()) {
            return result;
        }

        return Result.ok(
            [...result.value].sort((a, b) =>
                String(a.properties.title).localeCompare(String(b.properties.title))
            )
        );
    }
}

export const ListLayoutsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListLayoutsUseCaseImpl,
    dependencies: [WbPermissions, IdentityContext, ListLayoutsRepository]
});
