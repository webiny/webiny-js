import {
    TaskDefinition,
    TaskHandler
} from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { UPDATE_FLP_TASK_ID } from "~/flp/tasks/index.js";
import { type IUpdateFlpTaskInput } from "~/types.js";
import { UpdateFlpUseCase } from "~/features/flp/UpdateFlp/index.js";

class UpdateFlpTaskHandlerImpl implements TaskHandler.Interface<IUpdateFlpTaskInput> {
    public constructor(private updateFlp: UpdateFlpUseCase.Interface) {}

    async run({ input, controller }: TaskHandler.RunParams<IUpdateFlpTaskInput>) {
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

const UpdateFlpTaskHandler = TaskHandler.createImplementation({
    implementation: UpdateFlpTaskHandlerImpl,
    dependencies: [UpdateFlpUseCase]
});

class UpdateFlpTaskImpl implements TaskDefinition.Interface {
    public readonly id = UPDATE_FLP_TASK_ID;
    public readonly title = "ACO - Update FLP record";
    public readonly description =
        "Synchronizes the FLP catalog by updating the FLP record and its descendants based on the provided folder.";
    public readonly databaseLogs = false;
    public readonly isPrivate = true;
    public readonly selfCleanup = ["onSuccess" as const, "onAbort" as const];

    handler = UpdateFlpTaskHandler;
}

export const UpdateFlpTask = TaskDefinition.createImplementation({
    implementation: UpdateFlpTaskImpl,
    dependencies: []
});
