import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { getRequesterIdentity } from "~/domain/automation/getRequesterIdentity.js";
import { STEP_RUN_TASK_DEFINITION_ID } from "~/features/stepRun/constants.js";
import type { StepRunTaskInput } from "~/features/stepRun/types.js";
import { ReviewTaskAbortService } from "~/features/stepRun/ReviewTaskAbortService/index.js";
import { StepRunReachService as Abstraction } from "./abstractions.js";
import { hasErrorSource } from "~/domain/hasErrorSource.js";

class StepRunReachServiceImpl implements Abstraction.Interface {
    public constructor(
        private taskService: TaskService.Interface,
        private identityContext: IdentityContext.Interface,
        private taskAbort: ReviewTaskAbortService.Interface,
        private logger: Logger.Interface
    ) {}

    public async reach({
        review,
        step,
        actor,
        owner,
        now,
        failure,
        startFailure
    }: Abstraction.Params) {
        const data = review.toData();
        const requester = data.createdBy;

        // The trigger runs as the requester, never as `actor` (the approver of the previous step,
        // the restarter or the task itself): the task's `createdBy` must be the requester, which
        // the run handler checks (R148, R149). `TaskService.trigger` is unchanged; the identity
        // is switched for this call only and restored by `withIdentity`.
        let reason = failure;
        let taskId: string | null = null;
        if (reason === null) {
            const input: StepRunTaskInput = { reviewId: data.id, stepId: step.id };
            const identity = getRequesterIdentity(requester);
            try {
                const triggered = await this.identityContext.withIdentity(identity, () => {
                    return this.taskService.trigger({
                        definition: STEP_RUN_TASK_DEFINITION_ID,
                        name: `Workflow step: ${step.title}`,
                        input
                    });
                });
                if (triggered.isFail()) {
                    // The raw message can carry internals: logged, never stored (R146).
                    this.logger.error(
                        {
                            err: hasErrorSource(triggered.error)
                                ? triggered.error.source
                                : triggered.error,
                            reviewId: data.id,
                            stepId: step.id
                        },
                        "Could not start the step run task."
                    );
                    reason = startFailure;
                } else {
                    taskId = triggered.value.id;
                }
            } catch (error) {
                this.logger.error(
                    { error, reviewId: data.id, stepId: step.id },
                    "Could not start the step run task."
                );
                reason = startFailure;
            }
        }

        // The task id is stored by the one save. If the step cannot be reached after a successful
        // trigger, nothing will ever carry that id, so the task is aborted here.
        const reached = review.reachRun({ actor, owner, taskId, now });
        if (reached.isFail()) {
            if (taskId !== null) {
                await this.taskAbort.abort({
                    taskIds: [taskId],
                    message: "The review could not be saved."
                });
            }
            return Result.fail(reached.error);
        }
        if (reason === null) {
            return Result.ok();
        }

        // No task exists: record the reach without one, then fail the step with the reason. The
        // step stays restartable (D8); the use case saves the failed review as usual.
        const failed = review.fail({ stepId: step.id, reason, now });
        // Whatever `fail` returns is returned, never ignored (R159).
        if (failed.isFail()) {
            return Result.fail(failed.error);
        }
        return Result.ok();
    }
}

export const StepRunReachService = Abstraction.createImplementation({
    implementation: StepRunReachServiceImpl,
    dependencies: [TaskService, IdentityContext, ReviewTaskAbortService, Logger]
});
