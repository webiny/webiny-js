import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListEnabledAdminExtensionsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListAdminExtensionsRepository } from "~/api/adminExtensions/features/ListAdminExtensions/abstractions.js";
import { AdminExtensionNotAuthorizedError } from "~/api/adminExtensions/domain/errors.js";
import type { AdminExtension } from "~/api/adminExtensions/domain/AdminExtension.js";
import type { AdminExtensionKind } from "~/shared/adminExtensions/constants.js";

class ListEnabledAdminExtensionsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private readonly identityContext: IdentityContext.Interface,
        private readonly repository: ListAdminExtensionsRepository.Interface
    ) {}

    async execute(
        kind: AdminExtensionKind
    ): Promise<Result<AdminExtension[], UseCaseAbstraction.Error>> {
        const identity = this.identityContext.getIdentity();
        if (identity.isAnonymous()) {
            return Result.fail(new AdminExtensionNotAuthorizedError());
        }

        return this.repository.execute({ kind, enabled: true });
    }
}

export const ListEnabledAdminExtensionsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListEnabledAdminExtensionsUseCaseImpl,
    dependencies: [IdentityContext, ListAdminExtensionsRepository]
});
