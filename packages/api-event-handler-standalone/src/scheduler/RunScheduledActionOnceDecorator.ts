import { hostname } from "node:os";
import { ScheduledActionEventHandler } from "@webiny/event-handler-core";
import { SCHEDULED_ACTION_EVENT_IDENTIFIER } from "@webiny/event-handler-core";
import type { IScheduledActionEvent } from "@webiny/event-handler-core";
import type { IScheduledActionEventPayload } from "@webiny/event-handler-core";
import type { IScheduledActionResult } from "@webiny/event-handler-core";
import type { EventContext } from "@webiny/event-handler-core";
import type { NextFunction } from "@webiny/event-handler-core";
import { GetTenantByIdUseCase } from "@webiny/api-core/exports/api/tenancy.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { IdentityContext } from "@webiny/api-core/exports/api/security.js";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { KeyValueConditionFailedError } from "@webiny/api-core/features/keyValueStore/index.js";
import { GetScheduledActionUseCase } from "@webiny/api-scheduler/features/GetScheduledAction/index.js";

const CLAIM_SCOPE = "scheduler/claims";

/*
 * How long one run of an action holds its claim. Long enough for any action to finish; a run that
 * succeeds deletes the action, so the claim only matters while it runs.
 */
const RUN_CLAIM_MS = 10 * 60_000;

// After a failed run, other processes leave the action alone this long before trying it again.
const RETRY_AFTER_FAILURE_MS = 24 * 60 * 60_000;

/*
 * Timers fire slightly early or late; an action due within this much is run. One due later than that
 * belongs to a timer another process moved, and this firing is stale.
 */
const EARLY_TOLERANCE_MS = 1000;

const SUCCESS: IScheduledActionResult = { success: true };

// Names this process in the claims it writes, for whoever reads them in the database.
const PROCESS_NAME = `${hostname()}:${process.pid}`;

const expiresIn = (ms: number): Date => {
    const expiresAtMs = Date.now() + ms;
    return new Date(expiresAtMs);
};

/**
 * Runs a fired scheduled action at most once across all processes. Every standalone process holds its
 * own timers for the same actions, so the same action fires in each of them; on AWS, EventBridge
 * fires it once and this decorator is not registered.
 *
 * Before the action runs, it is read again. Gone means it was cancelled or already ran. Due later
 * means another process moved it and this timer is stale. Otherwise the process takes a claim on the
 * action at its due time, and only the process that gets it runs the action. Rescheduling changes
 * the due time, so a moved action gets a fresh claim.
 */
class RunScheduledActionOnceDecoratorImpl implements ScheduledActionEventHandler.Interface {
    public constructor(
        private readonly getTenantById: GetTenantByIdUseCase.Interface,
        private readonly tenantContext: TenantContext.Interface,
        private readonly identityContext: IdentityContext.Interface,
        private readonly getScheduledAction: GetScheduledActionUseCase.Interface,
        private readonly store: GlobalKeyValueStore.Interface,
        private readonly decoratee: ScheduledActionEventHandler.Interface
    ) {}

    public async execute(
        eventCtx: EventContext<IScheduledActionEvent>,
        next: NextFunction
    ): Promise<IScheduledActionResult> {
        const input = eventCtx.event[SCHEDULED_ACTION_EVENT_IDENTIFIER];
        const tenantId = input.tenant || this.tenantContext.getTenant().id;

        const dueAt = await this.findDueTime(tenantId, input);
        if (!dueAt) {
            return SUCCESS;
        }
        if (dueAt.getTime() > Date.now() + EARLY_TOLERANCE_MS) {
            return SUCCESS;
        }

        const key = `${tenantId}/${input.id}/${dueAt.toISOString()}`;
        const claimed = await this.takeClaim(key);
        if (!claimed) {
            return SUCCESS;
        }

        try {
            return await this.decoratee.execute(eventCtx, next);
        } catch (error) {
            await this.holdAfterFailure(key);
            throw error;
        }
    }

    // The action's due time, or `null` when it no longer exists.
    private async findDueTime(
        tenantId: string,
        input: IScheduledActionEventPayload
    ): Promise<Date | null> {
        const tenantResult = await this.getTenantById.execute(tenantId);
        if (tenantResult.isFail()) {
            throw tenantResult.error;
        }

        return this.tenantContext.withTenant(tenantResult.value, () => {
            // GetScheduledAction checks permissions, and nobody is signed in when a timer fires.
            return this.identityContext.withoutAuthorization(async () => {
                const result = await this.getScheduledAction.execute({
                    id: input.id,
                    namespace: input.namespace
                });
                if (result.isOk()) {
                    return result.value.scheduledFor;
                }
                if (result.error.code === "Scheduler/ScheduledAction/NotFound") {
                    return null;
                }
                throw result.error;
            });
        });
    }

    private async takeClaim(key: string): Promise<boolean> {
        const expiresAt = expiresIn(RUN_CLAIM_MS);
        const result = await this.store.set(key, PROCESS_NAME, {
            scope: CLAIM_SCOPE,
            expiresAt,
            condition: { exists: false }
        });
        if (result.isOk()) {
            return true;
        }
        if (result.error instanceof KeyValueConditionFailedError) {
            return false;
        }
        throw result.error;
    }

    /*
     * The action stays stored after a failed run, with the error on it, and every process's
     * recovery fires overdue actions each minute. Holding the claim keeps that to one retry a day.
     */
    private async holdAfterFailure(key: string): Promise<void> {
        const expiresAt = expiresIn(RETRY_AFTER_FAILURE_MS);
        await this.store.set(key, PROCESS_NAME, { scope: CLAIM_SCOPE, expiresAt });
    }
}

export const RunScheduledActionOnceDecorator = ScheduledActionEventHandler.createDecorator({
    decorator: RunScheduledActionOnceDecoratorImpl,
    dependencies: [
        GetTenantByIdUseCase,
        TenantContext,
        IdentityContext,
        GetScheduledActionUseCase,
        GlobalKeyValueStore
    ]
});
