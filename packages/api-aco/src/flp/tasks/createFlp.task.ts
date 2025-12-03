import { createPrivateTaskDefinition } from "@webiny/tasks";
import { CREATE_FLP_TASK_ID } from "~/flp/tasks/index.js";
import { type AcoContext, type ICreateFlpTaskInput, type ICreateFlpTaskParams } from "~/types.js";
import { CreateFlpUseCase } from "~/features/flp/CreateFlp/index.js";

class CreateFlpTask {
    public init = () => {
        return createPrivateTaskDefinition<AcoContext, ICreateFlpTaskInput>({
            id: CREATE_FLP_TASK_ID,
            title: "ACO - Create FLP record",
            description:
                "Synchronizes the FLP catalog by creating the FLP record based on the provided folder.",
            disableDatabaseLogs: true,
            run: async (params: ICreateFlpTaskParams) => {
                const { response, isAborted, input, context, isCloseToTimeout } = params;

                const useCase = context.container.resolve(CreateFlpUseCase);

                try {
                    if (isAborted()) {
                        return response.aborted();
                    } else if (isCloseToTimeout()) {
                        return response.continue(input);
                    }

                    await useCase.execute(input.folder);

                    return response.done("Task done: FLP record created.");
                } catch (error) {
                    return response.error(error);
                }
            }
        });
    };
}

export const createFlpTask = () => {
    const task = new CreateFlpTask();
    return task.init();
};
