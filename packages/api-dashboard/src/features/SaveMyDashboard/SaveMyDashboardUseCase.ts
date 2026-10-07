import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { SaveMyDashboardUseCase as UseCaseAbstraction } from "./abstractions.js";
import { SaveMyDashboardRepository } from "./abstractions.js";
import { DashboardNotAuthenticatedError } from "~/domain/errors.js";
import type { DashboardLayout } from "~/domain/types.js";

class SaveMyDashboardUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private repository: SaveMyDashboardRepository.Interface
    ) {}

    async execute(
        layout: DashboardLayout
    ): Promise<Result<DashboardLayout, UseCaseAbstraction.Error>> {
        const identity = this.identityContext.getIdentity();
        if (!identity || identity.isAnonymous()) {
            return Result.fail(new DashboardNotAuthenticatedError());
        }

        return await this.repository.save(identity.id, layout);
    }
}

export const SaveMyDashboardUseCase = UseCaseAbstraction.createImplementation({
    implementation: SaveMyDashboardUseCaseImpl,
    dependencies: [IdentityContext, SaveMyDashboardRepository]
});
