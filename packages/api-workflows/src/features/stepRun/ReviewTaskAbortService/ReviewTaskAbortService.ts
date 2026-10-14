import { Logger } from "@webiny/api-core/features/logger/index.js";
import { TaskService } from "@webiny/api-core/features/task/TaskService/index.js";
import { ReviewTaskAbortService as Abstraction } from "./abstractions.js";

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
                if (result.isFail()) {
                    this.logger.error(
                        { error: result.error, taskId },
                        "Could not abort a workflow step run task."
                    );
                }
            } catch (error) {
                this.logger.error({ error, taskId }, "Could not abort a workflow step run task.");
            }
        }
    }
}

export const ReviewTaskAbortService = Abstraction.createImplementation({
    implementation: ReviewTaskAbortServiceImpl,
    dependencies: [TaskService, Logger]
});
