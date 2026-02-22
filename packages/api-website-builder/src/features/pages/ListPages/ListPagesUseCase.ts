import { Result } from "@webiny/feature/api";
import { ListPagesUseCase as UseCaseAbstraction, ListPagesRepository } from "./abstractions.js";
import { WbPermissions } from "~/domain/permissions.js";
import { PageNotAuthorizedError } from "~/domain/page/errors.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";

class ListPagesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private identityContext: IdentityContext.Interface,
        private repository: ListPagesRepository.Interface
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

export const ListPagesUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListPagesUseCaseImpl,
    dependencies: [WbPermissions.Abstraction, IdentityContext, ListPagesRepository]
});
