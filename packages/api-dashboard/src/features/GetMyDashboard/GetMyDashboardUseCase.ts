import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetMyDashboardUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetMyDashboardRepository } from "./abstractions.js";
import { DashboardNotAuthenticatedError } from "~/domain/errors.js";
import type { DashboardLayout } from "~/domain/types.js";

class GetMyDashboardUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private repository: GetMyDashboardRepository.Interface
    ) {}

    async execute(): Promise<Result<DashboardLayout | null, UseCaseAbstraction.Error>> {
        const identity = this.identityContext.getIdentity();
        if (!identity || identity.isAnonymous()) {
            return Result.fail(new DashboardNotAuthenticatedError());
        }

        return await this.repository.get(identity.id);
    }
}

export const GetMyDashboardUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetMyDashboardUseCaseImpl,
    dependencies: [IdentityContext, GetMyDashboardRepository]
});
