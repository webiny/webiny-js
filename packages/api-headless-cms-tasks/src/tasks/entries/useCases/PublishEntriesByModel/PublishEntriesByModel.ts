import { ITaskResponseResult } from "@webiny/tasks";
import { TaskCreate, TaskProcess } from "../../domain";
import { EntriesTask, IBulkActionOperationByModelTaskParams } from "~/types";
import { IUseCase } from "~/tasks/IUseCase";
import { ListLatestEntries } from "~/tasks/entries/gateways";

export class PublishEntriesByModel
    implements IUseCase<IBulkActionOperationByModelTaskParams, ITaskResponseResult>
{
    public async execute(params: IBulkActionOperationByModelTaskParams) {
        const { input, response } = params;

        try {
            if (!input.modelId) {
                return response.error(`Missing "modelId" in the input.`);
            }

            if (input.processing) {
                const processTasks = new TaskProcess(EntriesTask.PublishEntries);
                return await processTasks.execute(params);
            }

            const gateway = new ListLatestEntries();
            const createTasks = new TaskCreate(EntriesTask.PublishEntries, gateway);
            return await createTasks.execute(params);
        } catch (ex) {
            return response.error(ex.message ?? "Error while executing PublishEntriesByModel");
        }
    }
}
