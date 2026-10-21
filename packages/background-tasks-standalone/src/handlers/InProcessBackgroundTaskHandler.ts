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
import { HANDED_BACK_STATUS } from "~/domain/TaskLoop.js";
import { ShutdownSignal } from "~/domain/ShutdownSignal.js";
import { ClaimRenewal } from "~/claim/ClaimRenewal.js";
import { CLAIM_TTL_MS } from "~/claim/constants.js";

/*
 * The time one iteration gets, the same 15 minutes as the background-task Lambda on AWS. A task
 * checks `isCloseToTimeout()` to save its progress and continue in a new iteration, so this also sets
 * how much work a crash can make it repeat. Given the loop's whole 24 hours, it would never save.
 */
const ITERATION_MAX_DURATION_MS = 900_000;

const claimedElsewhere = () => {
    return { status: CLAIMED_ELSEWHERE_STATUS };
};

const handedBack = () => {
    return { status: HANDED_BACK_STATUS };
};

/**
 * Runs one iteration of a background task in the request container the dispatcher built for it.
 * The standalone counterpart of `BackgroundTaskLambdaHandler`: same tenant set-up and runner, with
 * a process timer in place of the Lambda countdown.
 *
 * Every iteration runs under the task's claim, so only one process drives a task at a time. The
 * first iteration takes the claim, the later ones find it still theirs.
 *
 * When the process starts stopping, the running iteration's time runs out at once, so the task saves
 * its progress and hands back control. The task is then left to another process.
 */
class InProcessBackgroundTaskHandlerImpl implements BackgroundTaskEventHandler.Interface {
    public constructor(
        private readonly container: Container,
        private readonly rawTenantId: RawTenantId.Interface,
        private readonly tenantLoader: RequestTenantLoader.Interface,
        private readonly claim: TaskClaim.Interface,
        private readonly shutdown: ShutdownSignal.Interface,
        private readonly logger: Logger.Interface
    ) {}

    public async execute(eventCtx: EventContext<IBackgroundTaskEvent>): Promise<unknown> {
        const taskEvent = eventCtx.event;

        // The process started stopping after this iteration was dispatched: leave the task be.
        if (this.shutdown.isStopping()) {
            return handedBack();
        }

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

        const timer = new ProcessTimer(ITERATION_MAX_DURATION_MS);
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
        const stopListening = this.shutdown.onStop(() => {
            timer.expire();
        });
        renewal.start();
        try {
            result = await runner.run(taskEvent);
        } finally {
            renewal.stop();
            stopListening();
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

        /*
         * Stopping, with the task ready to go on at once: the claim is released, so another process
         * takes the task over at its next recovery sweep rather than once the claim runs out.
         */
        const stopping = this.shutdown.isStopping();
        if (stopping && waitMs === 0) {
            await this.release(target);
            return handedBack();
        }

        const kept = await this.claim.keep(target, CLAIM_TTL_MS + waitMs);
        if (!kept) {
            return claimedElsewhere();
        }
        // Stopping, with the task due later: it keeps its claim, so nobody runs it before it's due.
        if (stopping) {
            return handedBack();
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
    dependencies: [
        RequestContainer,
        RawTenantId,
        RequestTenantLoader,
        TaskClaim,
        ShutdownSignal,
        Logger
    ]
});
