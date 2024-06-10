import { ITaskResponseResult } from "@webiny/tasks";
import { TaskCreate, TaskProcess } from "../../domain";
import { ListDeletedEntries } from "~/tasks/entries/gateways";
import { EntriesTask, IBulkActionOperationByModelTaskParams } from "~/types";
import { IUseCase } from "~/tasks/IUseCase";

export class RestoreEntriesFromTrashByModel
    implements IUseCase<IBulkActionOperationByModelTaskParams, ITaskResponseResult>
{
    public async execute(params: IBulkActionOperationByModelTaskParams) {
        const { input, response } = params;

        try {
            if (input.processing) {
                const processTasks = new TaskProcess(EntriesTask.RestoreEntriesFromTrash);
                return await processTasks.execute(params);
            }

            const gateway = new ListDeletedEntries();
            const createTasks = new TaskCreate(EntriesTask.RestoreEntriesFromTrash, gateway);
            return await createTasks.execute(params);
        } catch (ex) {
            return response.error(
                ex.message ?? "Error while executing RestoreEntriesFromTrashByModel"
            );
        }
    }
}
