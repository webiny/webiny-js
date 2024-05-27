import { ITaskResponseResult } from "@webiny/tasks";
import { TaskProcess } from "../../domain";
import { CreateTasks } from "./CreateTasks";
import { EntriesTask, IBulkActionOperationByModelTaskParams } from "~/types";
import { IUseCase } from "~/tasks/IUseCase";

export class MoveEntriesToTrashByModel
    implements IUseCase<IBulkActionOperationByModelTaskParams, ITaskResponseResult>
{
    public async execute(params: IBulkActionOperationByModelTaskParams) {
        const { input, response } = params;

        try {
            if (input.processing) {
                const processTasks = new TaskProcess(EntriesTask.MoveEntriesToTrashByModel);
                return await processTasks.execute(params);
            }

            const createTasks = new CreateTasks();
            return await createTasks.execute(params);
        } catch (ex) {
            return response.error(ex.message ?? "Error while executing MoveEntriesToTrashByModel");
        }
    }
}
