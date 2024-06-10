import { ITaskResponseResult } from "@webiny/tasks";
import { TaskCreate, TaskProcess } from "../../domain";
import { ListLatestEntries } from "~/tasks/entries/gateways";
import { EntriesTask, IBulkActionOperationByModelTaskParams } from "~/types";
import { IUseCase } from "~/tasks/IUseCase";

export class MoveEntriesToFolderByModel
    implements IUseCase<IBulkActionOperationByModelTaskParams, ITaskResponseResult>
{
    public async execute(params: IBulkActionOperationByModelTaskParams) {
        const { input, response } = params;

        try {
            if (!input.modelId) {
                return response.error(`Missing "modelId" in the input.`);
            }

            if (!input?.data?.folderId) {
                return response.error(`Missing "folderId" in the input.`);
            }

            if (input.processing) {
                const processTasks = new TaskProcess(EntriesTask.MoveEntriesToFolder);
                return await processTasks.execute(params);
            }

            const gateway = new ListLatestEntries();
            const createTasks = new TaskCreate(EntriesTask.MoveEntriesToFolder, gateway);
            return await createTasks.execute(params);
        } catch (ex) {
            return response.error(ex.message ?? "Error while executing MoveEntriesToFolderByModel");
        }
    }
}
