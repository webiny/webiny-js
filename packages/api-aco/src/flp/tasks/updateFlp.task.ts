import { createPrivateTaskDefinition } from "@webiny/tasks";
import { UPDATE_FLP_TASK_ID } from "~/flp/tasks/index.js";
import { type AcoContext, type IUpdateFlpTaskInput, type IUpdateFlpTaskParams } from "~/types.js";
import { UpdateFlpUseCase } from "~/features/flp/UpdateFlp/index.js";

class UpdateFlpTask {
    public init = () => {
        return createPrivateTaskDefinition<AcoContext, IUpdateFlpTaskInput>({
            id: UPDATE_FLP_TASK_ID,
            title: "ACO - Update FLP record",
            description:
                "Synchronizes the FLP catalog by updating the FLP record and its descendants based on the provided folder.",
            disableDatabaseLogs: true,
            run: async (params: IUpdateFlpTaskParams) => {
                const { response, isAborted, input, context, isCloseToTimeout } = params;

                const useCase = context.container.resolve(UpdateFlpUseCase);

                try {
                    if (isAborted()) {
                        return response.aborted();
                    }
                    await useCase.execute({
                        folder: input.folder,
                        queued: input.queued,
                        isCloseToTimeout: isCloseToTimeout,
                        handleTimeout: queued => response.continue({ ...input, queued })
                    });
                    return response.done("Task done: FLP record updated.");
                } catch (error) {
                    return response.error(error);
                }
            }
        });
    };
}

export const updateFlpTask = () => {
    const task = new UpdateFlpTask();
    return task.init();
};
