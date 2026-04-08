import { Result } from "@webiny/feature/api";
import {
    ListDeletedPagesUseCase as UseCaseAbstraction,
    ListDeletedPagesRepository
} from "./abstractions.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";
import { PageNotAuthorizedError } from "~/domain/page/errors.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";

class ListDeletedPagesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private identityContext: IdentityContext.Interface,
        private repository: ListDeletedPagesRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canRead("page");
        if (!hasPermission) {
            return Result.fail(new PageNotAuthorizedError());
        }

        const where = { ...params.where };

        if (await this.permissions.onlyOwnRecords("page")) {
            const identity = this.identityContext.getIdentity();
            where.createdBy = identity.id;
        }

        return this.repository.execute({ ...params, where });
    }
}

export const ListDeletedPagesUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListDeletedPagesUseCaseImpl,
    dependencies: [WbPermissions, IdentityContext, ListDeletedPagesRepository]
});
