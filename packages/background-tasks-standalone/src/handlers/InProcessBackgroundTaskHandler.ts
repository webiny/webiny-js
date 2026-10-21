import type { Container } from "@webiny/feature/api";
import { BackgroundTaskEventHandler } from "@webiny/event-handler-core";
import { RequestContainer } from "@webiny/event-handler-core";
import type { EventContext } from "@webiny/event-handler-core";
import type { IBackgroundTaskEvent } from "@webiny/event-handler-core";
import { RawTenantId } from "@webiny/api-core/features/requestContext/index.js";
import { RequestTenantLoader } from "@webiny/api-core/features/requestContext/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { TaskResultStatus } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { TaskRunner } from "@webiny/background-tasks/api/runner/index.js";
import { TaskEventValidation } from "@webiny/background-tasks/api/runner/TaskEventValidation.js";
import type { Context } from "@webiny/background-tasks/api/types.js";
import type { IResponseResult } from "@webiny/background-tasks/api/response/abstractions/index.js";
import { ProcessTimer } from "~/timer/ProcessTimer.js";
import { TaskClaim } from "~/domain/TaskClaim.js";
import { CLAIMED_ELSEWHERE_STATUS } from "~/domain/TaskLoop.js";
import { ClaimRenewal } from "~/claim/ClaimRenewal.js";
import { CLAIM_TTL_MS } from "~/claim/constants.js";

const claimedElsewhere = () => {
    return { status: CLAIMED_ELSEWHERE_STATUS };
};

/**
 * Runs one iteration of a background task in the request container the dispatcher built for it.
 * The standalone counterpart of `BackgroundTaskLambdaHandler`: same tenant set-up and runner, with
 * a process timer in place of the Lambda countdown.
 *
 * Every iteration runs under the task's claim, so only one process drives a task at a time. The
 * first iteration takes the claim, the later ones find it still theirs.
 */
class InProcessBackgroundTaskHandlerImpl implements BackgroundTaskEventHandler.Interface {
    public constructor(
        private readonly container: Container,
        private readonly rawTenantId: RawTenantId.Interface,
        private readonly tenantLoader: RequestTenantLoader.Interface,
        private readonly claim: TaskClaim.Interface,
        private readonly logger: Logger.Interface
    ) {}

    public async execute(eventCtx: EventContext<IBackgroundTaskEvent>): Promise<unknown> {
        const taskEvent = eventCtx.event;

        this.rawTenantId.set(taskEvent.tenant);
        await this.tenantLoader.establish();

        const target: TaskClaim.Target = {
            tenant: taskEvent.tenant,
            taskId: taskEvent.webinyTaskId
        };
        const held = await this.hold(target);
        if (!held) {
            return claimedElsewhere();
        }

        const timer = new ProcessTimer();
        const renewal = new ClaimRenewal({
            claim: this.claim,
            target,
            onLost: () => {
                // Another process may already be running it. Ask the task to save and stop.
                timer.expire();
                this.logger.warn({ ...target }, "Lost the claim on a running background task.");
            },
            onError: error => {
                this.logger.warn({ error, ...target }, "Could not extend a background task claim.");
            }
        });

        // TaskRunner still takes the legacy context object, which now only carries the container.
        const ctx: Record<string, any> = { container: this.container };
        const runner = new TaskRunner(ctx as Context, timer, new TaskEventValidation());

        let result: IResponseResult;
        renewal.start();
        try {
            result = await runner.run(taskEvent);
        } finally {
            renewal.stop();
        }

        if (renewal.isLost()) {
            return claimedElsewhere();
        }

        // The loop reads `status`, `wait` and `delay` from this to decide what happens next.
        return this.afterIteration(target, result);
    }

    // Later iterations find the claim already theirs; only the first has to take it.
    private async hold(target: TaskClaim.Target): Promise<boolean> {
        const kept = await this.claim.keep(target, CLAIM_TTL_MS);
        if (kept) {
            return true;
        }
        return this.claim.take(target, CLAIM_TTL_MS);
    }

    private async afterIteration(
        target: TaskClaim.Target,
        result: IResponseResult
    ): Promise<unknown> {
        if (result.status !== TaskResultStatus.CONTINUE) {
            await this.release(target);
            return result;
        }

        /*
         * The loop now sleeps for `wait` seconds, with nothing renewing the claim. It is extended
         * past the wait instead, so other processes leave the task alone until it is due again. If
         * this process dies meanwhile, they take the task over once the wait and one TTL are up.
         */
        const waitMs = (result.wait ?? 0) * 1000;
        const kept = await this.claim.keep(target, CLAIM_TTL_MS + waitMs);
        if (!kept) {
            return claimedElsewhere();
        }
        return result;
    }

    /*
     * A claim that cannot be released runs out on its own. Recovery then finds the task finished and
     * leaves it alone, so the failure is only worth a warning.
     */
    private async release(target: TaskClaim.Target): Promise<void> {
        try {
            await this.claim.release(target);
        } catch (error) {
            this.logger.warn({ error, ...target }, "Could not release a background task claim.");
        }
    }
}

export const InProcessBackgroundTaskHandler = BackgroundTaskEventHandler.createImplementation({
    implementation: InProcessBackgroundTaskHandlerImpl,
    dependencies: [RequestContainer, RawTenantId, RequestTenantLoader, TaskClaim, Logger]
});
