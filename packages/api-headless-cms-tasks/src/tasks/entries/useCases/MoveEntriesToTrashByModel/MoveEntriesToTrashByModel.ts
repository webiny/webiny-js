import { ITaskResponseResult } from "@webiny/tasks";
import { TaskCreate, TaskProcess } from "../../domain";
import { ListLatestEntries } from "~/tasks/entries/gateways";
import { EntriesTask, IBulkActionOperationByModelTaskParams } from "~/types";
import { IUseCase } from "~/tasks/IUseCase";

export class MoveEntriesToTrashByModel
    implements IUseCase<IBulkActionOperationByModelTaskParams, ITaskResponseResult>
{
    public async execute(params: IBulkActionOperationByModelTaskParams) {
        const { input, response } = params;

        try {
            if (input.processing) {
                const processTasks = new TaskProcess(EntriesTask.MoveEntriesToTrash);
                return await processTasks.execute(params);
            }

            const gateway = new ListLatestEntries();
            const createTasks = new TaskCreate(EntriesTask.MoveEntriesToTrash, gateway);
            return await createTasks.execute(params);
        } catch (ex) {
            return response.error(ex.message ?? "Error while executing MoveEntriesToTrashByModel");
        }
    }
}
