import { Result, createImplementation } from "@webiny/feature/api";
import {
    ListRedirectsUseCase as UseCaseAbstraction,
    ListRedirectsRepository
} from "./abstractions.js";
import { WbPermissions } from "~/domain/permissions.js";
import { RedirectNotAuthorizedError } from "~/domain/redirect/errors.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";

class ListRedirectsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WbPermissions.Interface,
        private identityContext: IdentityContext.Interface,
        private repository: ListRedirectsRepository.Interface
    ) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        const hasPermission = await this.permissions.canRead("redirect");
        if (!hasPermission) {
            return Result.fail(new RedirectNotAuthorizedError());
        }

        const where = { ...params.where };

        if (await this.permissions.onlyOwnRecords("redirect")) {
            const identity = this.identityContext.getIdentity();
            where.createdBy = identity.id;
        }

        return await this.repository.execute({ ...params, where });
    }
}

export const ListRedirectsUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: ListRedirectsUseCaseImpl,
    dependencies: [WbPermissions.Abstraction, IdentityContext, ListRedirectsRepository]
});
