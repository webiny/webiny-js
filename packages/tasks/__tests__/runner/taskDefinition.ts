import { createTaskDefinition } from "~/task";

export const taskDefinition = createTaskDefinition({
    id: "taskRunnerTask",
    title: "Task Runner Task",
    maxIterations: 2,
    run: async ({ response, isCloseToTimeout, isAborted, input }) => {
        if (isAborted()) {
            return response.aborted();
        } else if (isCloseToTimeout()) {
            return response.continue({
                ...input,
                continuing: true
            });
        }
        return response.done("Task is done!", {
            myCustomOutput: "yes!"
        });
    }
});
