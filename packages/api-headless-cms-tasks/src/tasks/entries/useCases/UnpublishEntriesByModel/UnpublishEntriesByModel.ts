import { ITaskResponseResult } from "@webiny/tasks";
import { TaskProcess, TaskCreate } from "../../domain";
import { ListPublishedEntries } from "~/tasks/entries/gateways";
import { EntriesTask, IBulkActionOperationByModelTaskParams } from "~/types";
import { IUseCase } from "~/tasks/IUseCase";

export class UnpublishEntriesByModel
    implements IUseCase<IBulkActionOperationByModelTaskParams, ITaskResponseResult>
{
    public async execute(params: IBulkActionOperationByModelTaskParams) {
        const { input, response } = params;

        try {
            if (!input.modelId) {
                return response.error(`Missing "modelId" in the input.`);
            }

            if (input.processing) {
                const processTasks = new TaskProcess(EntriesTask.UnpublishEntries);
                return await processTasks.execute(params);
            }

            const gateway = new ListPublishedEntries();
            const createTasks = new TaskCreate(EntriesTask.UnpublishEntries, gateway);
            return await createTasks.execute(params);
        } catch (ex) {
            return response.error(ex.message ?? "Error while executing UnpublishEntriesByModel");
        }
    }
}
