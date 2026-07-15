import { ScheduledActionEventHandler } from "@webiny/event-handler-aws/abstractions/handlers/ScheduledActionEventHandler.js";
import { ExecuteScheduledActionUseCase } from "./features/ExecuteScheduledAction/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { GetTenantByIdUseCase } from "@webiny/api-core/exports/api/tenancy.js";
import { SCHEDULED_ACTION_EVENT_IDENTIFIER } from "./constants.js";
class ScheduledActionLambdaHandlerImpl {
    constructor(executeScheduledAction, tenantContext, getTenantById){
        this.executeScheduledAction = executeScheduledAction;
        this.tenantContext = tenantContext;
        this.getTenantById = getTenantById;
    }
    async execute(eventCtx, _next) {
        const input = eventCtx.event[SCHEDULED_ACTION_EVENT_IDENTIFIER];
        if (!input.tenant) input.tenant = this.tenantContext.getTenant().id;
        const tenantResult = await this.getTenantById.execute(input.tenant);
        if (tenantResult.isFail()) throw tenantResult.error;
        const tenant = tenantResult.value;
        return this.tenantContext.withTenant(tenant, async ()=>{
            const result = await this.executeScheduledAction.execute(input);
            if (result.isFail()) {
                const error = result.error;
                console.error(error.code, error.message);
                throw error;
            }
            return {
                success: true
            };
        });
    }
}
const ScheduledActionLambdaHandler = ScheduledActionEventHandler.createImplementation({
    implementation: ScheduledActionLambdaHandlerImpl,
    dependencies: [
        ExecuteScheduledActionUseCase,
        TenantContext,
        GetTenantByIdUseCase
    ]
});
export { ScheduledActionLambdaHandler };

//# sourceMappingURL=ScheduledActionLambdaHandler.js.map