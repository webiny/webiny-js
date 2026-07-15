import { ScheduledActionEventHandler } from "@webiny/event-handler-aws/abstractions/handlers/ScheduledActionEventHandler.js";
import type { IScheduledActionEvent } from "@webiny/event-handler-aws/eventTypes/ScheduledActionEventType.js";
import type { IScheduledActionResult } from "@webiny/event-handler-aws/abstractions/handlers/ScheduledActionEventHandler.js";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";
import type { IExecuteScheduledActionUseCase } from "~/features/ExecuteScheduledAction/abstractions.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { GetTenantByIdUseCase } from "@webiny/api-core/exports/api/tenancy.js";
declare class ScheduledActionLambdaHandlerImpl implements ScheduledActionEventHandler.Interface {
    private executeScheduledAction;
    private tenantContext;
    private getTenantById;
    constructor(executeScheduledAction: IExecuteScheduledActionUseCase, tenantContext: TenantContext.Interface, getTenantById: GetTenantByIdUseCase.Interface);
    execute(eventCtx: EventContext<IScheduledActionEvent>, _next: NextFunction): Promise<IScheduledActionResult>;
}
export declare const ScheduledActionLambdaHandler: typeof ScheduledActionLambdaHandlerImpl & {
    __abstraction: import("@webiny/di").Abstraction<import("@webiny/event-handler-aws/abstractions/handlers/ScheduledActionEventHandler.js").IScheduledActionEventHandler>;
};
export {};
