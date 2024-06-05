import { ITaskResponseResult } from "@webiny/tasks";
import { TaskCreate, TaskProcess } from "../../domain";
import { EntriesTask, IBulkActionOperationByModelTaskParams } from "~/types";
import { IUseCase } from "~/tasks/IUseCase";
import { ListDeletedEntries } from "~/tasks/entries/gateways";

export class DeleteEntriesByModel
    implements IUseCase<IBulkActionOperationByModelTaskParams, ITaskResponseResult>
{
    public async execute(params: IBulkActionOperationByModelTaskParams) {
        const { input, response } = params;

        try {
            if (!input.modelId) {
                return response.error(`Missing "modelId" in the input.`);
            }

            if (input.processing) {
                const processTasks = new TaskProcess(EntriesTask.DeleteEntries);
                return await processTasks.execute(params);
            }

            const gateway = new ListDeletedEntries();
            const createTasks = new TaskCreate(EntriesTask.DeleteEntries, gateway);
            return await createTasks.execute(params);
        } catch (ex) {
            return response.error(ex.message ?? "Error while executing DeleteEntriesByModel");
        }
    }
}
