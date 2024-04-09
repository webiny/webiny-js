import { ITaskResponseResult } from "@webiny/tasks";
import { taskRepositoryFactory } from "./TaskRepositoryFactory";
import { ProcessDeleteEntriesTasks } from "./ProcessDeleteEntriesTasks";
import { CreateDeleteEntriesTasks } from "./CreateDeleteEntriesTasks";
import { IEmptyTrashBinByModelTaskParams } from "~/types";

export class EmptyTrashBinByModel {
    public async execute(params: IEmptyTrashBinByModelTaskParams): Promise<ITaskResponseResult> {
        const { input, response, store } = params;

        try {
            const taskRepository = taskRepositoryFactory.getRepository(store.getTask().id);

            if (input.processing) {
                const processDeleteEntriesTasks = new ProcessDeleteEntriesTasks(taskRepository);
                return await processDeleteEntriesTasks.execute(params);
            }

            const createDeleteEntriesTasks = new CreateDeleteEntriesTasks();
            return await createDeleteEntriesTasks.execute(params);
        } catch (ex) {
            return response.error(ex.message ?? "Error while executing EmptyTrashBinByModel");
        }
    }
}
