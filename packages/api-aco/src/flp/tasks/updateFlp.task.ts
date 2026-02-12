import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { UPDATE_FLP_TASK_ID } from "~/flp/tasks/index.js";
import { type IUpdateFlpTaskInput } from "~/types.js";
import { UpdateFlpUseCase } from "~/features/flp/UpdateFlp/index.js";

class UpdateFlpTaskImpl implements TaskDefinition.Interface<IUpdateFlpTaskInput> {
    id = UPDATE_FLP_TASK_ID;
    title = "ACO - Update FLP record";
    description =
        "Synchronizes the FLP catalog by updating the FLP record and its descendants based on the provided folder.";
    enableDatabaseLogs = false;

    constructor(private updateFlp: UpdateFlpUseCase.Interface) {}

    async run({ input, controller }: TaskDefinition.RunParams<IUpdateFlpTaskInput>) {
        try {
            if (controller.runtime.isAborted()) {
                return controller.response.aborted();
            }

            await this.updateFlp.execute({
                folder: input.folder,
                queued: input.queued,
                isCloseToTimeout: controller.runtime.isCloseToTimeout,
                handleTimeout: queued => controller.response.continue({ ...input, queued })
            });

            return controller.response.done("Task done: FLP record updated.");
        } catch (error) {
            return controller.response.error(error);
        }
    }
}

export const UpdateFlpTask = TaskDefinition.createImplementation({
    implementation: UpdateFlpTaskImpl,
    dependencies: [UpdateFlpUseCase]
});
