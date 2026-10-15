import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListDashboardsUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ListDashboardsRepository } from "./abstractions.js";
import { DashboardNotAuthenticatedError } from "~/domain/errors.js";
import type { DashboardLayout } from "~/domain/types.js";

class ListDashboardsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private repository: ListDashboardsRepository.Interface
    ) {}

    async execute(): Promise<Result<DashboardLayout[], UseCaseAbstraction.Error>> {
        const identity = this.identityContext.getIdentity();
        if (!identity || identity.isAnonymous()) {
            return Result.fail(new DashboardNotAuthenticatedError());
        }

        const result = await this.repository.get(identity.id);
        if (result.isFail()) {
            return Result.fail(result.error);
        }
        if (!result.value) {
            return Result.ok([]);
        }
        return Result.ok([result.value]);
    }
}

export const ListDashboardsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListDashboardsUseCaseImpl,
    dependencies: [IdentityContext, ListDashboardsRepository]
});
