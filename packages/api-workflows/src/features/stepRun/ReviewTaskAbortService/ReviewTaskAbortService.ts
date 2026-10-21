import { TaskAbortError, TaskNotFoundError } from "@webiny/background-tasks/api/domain/errors.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { ReviewTaskAbortService as Abstraction } from "./abstractions.js";
import { hasErrorSource } from "~/domain/hasErrorSource.js";

class ReviewTaskAbortServiceImpl implements Abstraction.Interface {
    public constructor(
        private taskService: TaskService.Interface,
        private logger: Logger.Interface
    ) {}

    public async abort(params: Abstraction.Params): Promise<void> {
        for (const taskId of params.taskIds) {
            try {
                const result = await this.taskService.abort({
                    id: taskId,
                    message: params.message
                });
                if (
                    result.isFail() &&
                    (result.error instanceof TaskAbortError ||
                        result.error instanceof TaskNotFoundError)
                ) {
                    // The task is no longer pending or running, or it already cleaned itself up
                    // (R179): nothing left to abort.
                    this.logger.info({ taskId }, "The step run task had already ended.");
                } else if (result.isFail()) {
                    this.logger.error(
                        {
                            err: hasErrorSource(result.error) ? result.error.source : result.error,
                            taskId
                        },
                        "Could not abort a workflow step run task."
                    );
                }
            } catch (error) {
                this.logger.error(
                    { err: error, taskId },
                    "Could not abort a workflow step run task."
                );
            }
        }
    }
}

export const ReviewTaskAbortService = Abstraction.createImplementation({
    implementation: ReviewTaskAbortServiceImpl,
    dependencies: [TaskService, Logger]
});
