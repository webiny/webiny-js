import { ScheduledActionEventHandler } from "@webiny/event-handler-aws/abstractions/handlers/ScheduledActionEventHandler.js";
import type { IScheduledActionEvent } from "@webiny/event-handler-aws/eventTypes/ScheduledActionEventType.js";
import type { IScheduledActionResult } from "@webiny/event-handler-aws/abstractions/handlers/ScheduledActionEventHandler.js";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";
import { ExecuteScheduledActionUseCase } from "~/features/ExecuteScheduledAction/index.js";
import type { IExecuteScheduledActionUseCase } from "~/features/ExecuteScheduledAction/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { GetTenantByIdUseCase } from "@webiny/api-core/exports/api/tenancy.js";
import { SCHEDULED_ACTION_EVENT_IDENTIFIER } from "~/constants.js";

class ScheduledActionLambdaHandlerImpl implements ScheduledActionEventHandler.Interface {
    constructor(
        private executeScheduledAction: IExecuteScheduledActionUseCase,
        private tenantContext: TenantContext.Interface,
        private getTenantById: GetTenantByIdUseCase.Interface
    ) {}

    async execute(
        eventCtx: EventContext<IScheduledActionEvent>,
        _next: NextFunction
    ): Promise<IScheduledActionResult> {
        const input = eventCtx.event[SCHEDULED_ACTION_EVENT_IDENTIFIER];

        /**
         * Use the current tenant if the payload doesn't carry one — keeps backward compatibility
         * with scheduled actions created before `tenant` was added to the payload. The actual
         * per-request DynamoDB queries run inside withTenant() below.
         */
        if (!input.tenant) {
            input.tenant = this.tenantContext.getTenant().id;
        }

        const tenantResult = await this.getTenantById.execute(input.tenant);
        if (tenantResult.isFail()) {
            throw tenantResult.error;
        }
        const tenant = tenantResult.value;

        return this.tenantContext.withTenant(tenant, async () => {
            const result = await this.executeScheduledAction.execute(input);

            if (result.isFail()) {
                const error = result.error;
                console.error(error.code, error.message);
                throw error;
            }

            return { success: true };
        });
    }
}

export const ScheduledActionLambdaHandler = ScheduledActionEventHandler.createImplementation({
    implementation: ScheduledActionLambdaHandlerImpl,
    dependencies: [ExecuteScheduledActionUseCase, TenantContext, GetTenantByIdUseCase]
});
