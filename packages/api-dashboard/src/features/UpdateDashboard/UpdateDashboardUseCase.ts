import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { UpdateDashboardUseCase as UseCaseAbstraction } from "./abstractions.js";
import { UpdateDashboardRepository } from "./abstractions.js";
import { DashboardNotAuthenticatedError } from "~/domain/errors.js";
import { DashboardValidationError } from "~/domain/errors.js";
import { updateDashboardValidation } from "./schema.js";
import type { DashboardLayout } from "~/domain/types.js";

class UpdateDashboardUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private identityContext: IdentityContext.Interface,
        private repository: UpdateDashboardRepository.Interface
    ) {}

    async execute(
        layout: DashboardLayout
    ): Promise<Result<DashboardLayout, UseCaseAbstraction.Error>> {
        const identity = this.identityContext.getIdentity();
        if (!identity || identity.isAnonymous()) {
            return Result.fail(new DashboardNotAuthenticatedError());
        }

        const validation = updateDashboardValidation.safeParse(layout);
        if (!validation.success) {
            const [issue] = validation.error.issues;
            return Result.fail(new DashboardValidationError(issue.message));
        }

        return await this.repository.save(identity.id, validation.data);
    }
}

export const UpdateDashboardUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateDashboardUseCaseImpl,
    dependencies: [IdentityContext, UpdateDashboardRepository]
});
