import type { EventBridgeEvent } from "@webiny/aws-sdk/types/index.js";
import {
    EventBridgeEventHandler,
    type EventBridgeResult
} from "@webiny/event-handler-aws/abstractions/handlers/EventBridgeEventHandler.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/abstractions.js";
import { SWEEP_STALE_VALUES_TASK_ID } from "@webiny/activity-log/api";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";

export const ACTIVITY_LOG_SWEEP_DETAIL_TYPE = "WebinyActivityLogSweep";

/**
 * Fires the activity log's stale-value sweep on a schedule.
 *
 * The sweep clears the transient content values from records whose summary job never ran — a
 * Lambda timeout, or a task created whose execution never started. Those are the only two routes
 * by which raw content outlives the job that needed it, and because activity records are kept
 * permanently, "outlives" means forever without this.
 *
 * Here rather than in `@webiny/activity-log` because the schedule is infrastructure. That package
 * carries no AWS dependency, and a feature that works on any runtime should not acquire one to
 * get a cron. The task itself, and every decision about what is stale, live there; this only
 * decides when to ask.
 *
 * Takes the root-tenant wrapper from `BulkActionsEventBridgeLambdaHandler`: an EventBridge
 * invocation carries no tenant, and a sweep that ran as nobody would search nothing.
 *
 * It does **not** take that handler's shape for a non-matching event. `executeChain` is middleware
 * — a handler passes the event on by calling `next()`, and returning instead ends the chain for
 * everyone behind it. The bulk-actions handler returns `{ success: true }` for every detail-type
 * that is not its own, so it is a terminator, and anything registered after it never runs. That is
 * why this one calls `next()`, and why `registerInboundEventTypes` puts it first.
 */
class ActivityLogSweepEventBridgeLambdaHandlerImpl implements EventBridgeEventHandler.Interface {
    public constructor(
        private readonly tenantContext: TenantContext.Interface,
        private readonly taskService: TaskService.Interface
    ) {}

    public async execute(
        eventCtx: EventContext<EventBridgeEvent<string, any>>,
        next: NextFunction
    ): Promise<EventBridgeResult> {
        if (eventCtx.event["detail-type"] !== ACTIVITY_LOG_SWEEP_DETAIL_TYPE) {
            return next();
        }

        await this.tenantContext.withRootTenant(async () => {
            return await this.taskService.trigger({
                definition: SWEEP_STALE_VALUES_TASK_ID,
                name: "Activity log stale value sweep"
            });
        });

        return { success: true };
    }
}

export const ActivityLogSweepEventBridgeLambdaHandler =
    EventBridgeEventHandler.createImplementation({
        implementation: ActivityLogSweepEventBridgeLambdaHandlerImpl,
        dependencies: [TenantContext, TaskService]
    });
