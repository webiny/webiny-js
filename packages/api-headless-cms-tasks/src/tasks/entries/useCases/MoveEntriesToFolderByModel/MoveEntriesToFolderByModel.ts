import { ITaskResponseResult } from "@webiny/tasks";
import { TaskProcess } from "../../domain";
import { CreateTasks } from "./CreateTasks";
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
                const processTasks = new TaskProcess(EntriesTask.MoveEntriesToFolderByModel);
                return await processTasks.execute(params);
            }

            const createTasks = new CreateTasks();
            return await createTasks.execute(params);
        } catch (ex) {
            return response.error(ex.message ?? "Error while executing MoveEntriesToFolderByModel");
        }
    }
}
