import { ScheduledActionInputHandler } from "@webiny/api-kernel-core";
import type { IScheduledActionEvent } from "@webiny/api-kernel-core";
import type { IScheduledActionResult } from "@webiny/api-kernel-core";
import type { InputContext, NextFunction } from "@webiny/api-kernel-core";
import { ExecuteScheduledActionUseCase } from "~/features/ExecuteScheduledAction/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { GetTenantByIdUseCase, TenantScopes } from "@webiny/api-core/exports/api/tenancy.js";
import { SCHEDULED_ACTION_EVENT_IDENTIFIER } from "~/constants.js";

class ScheduledActionLambdaHandlerImpl implements ScheduledActionInputHandler.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private getTenantById: GetTenantByIdUseCase.Interface,
        private tenantScopes: TenantScopes.Interface
    ) {}

    async execute(
        inputCtx: InputContext<IScheduledActionEvent>,
        _next: NextFunction
    ): Promise<IScheduledActionResult> {
        const input = inputCtx.input[SCHEDULED_ACTION_EVENT_IDENTIFIER];

        /**
         * Use the current tenant if the payload doesn't carry one — keeps backward compatibility
         * with scheduled actions created before `tenant` was added to the payload. The action runs in
         * its tenant's scope (the one this event already runs in, see `ScheduledActionTenantSource`).
         */
        if (!input.tenant) {
            input.tenant = this.tenantContext.getTenant().id;
        }

        const tenantResult = await this.getTenantById.execute(input.tenant);
        if (tenantResult.isFail()) {
            throw tenantResult.error;
        }
        const tenant = tenantResult.value;

        return this.tenantScopes.withTenant(tenant, async scope => {
            const result = await scope.resolve(ExecuteScheduledActionUseCase).execute(input);

            if (result.isFail()) {
                const error = result.error;
                console.error(error.code, error.message);
                throw error;
            }

            return { success: true };
        });
    }
}

export const ScheduledActionLambdaHandler = ScheduledActionInputHandler.createImplementation({
    implementation: ScheduledActionLambdaHandlerImpl,
    dependencies: [TenantContext, GetTenantByIdUseCase, TenantScopes]
});
