import { ITaskResponseResult } from "@webiny/tasks";
import { ProcessTasks } from "./ProcessTasks";
import { CreateTasks } from "./CreateTasks";
import { IBulkActionOperationByModelTaskParams } from "~/types";
import { IUseCase } from "~/tasks/IUseCase";

export class MoveEntriesToFolderByModel
    implements IUseCase<IBulkActionOperationByModelTaskParams, ITaskResponseResult>
{
    public async execute(params: IBulkActionOperationByModelTaskParams) {
        const { input, response } = params;

        try {
            if (input.processing) {
                const processTasks = new ProcessTasks();
                return await processTasks.execute(params);
            }

            const createTasks = new CreateTasks();
            return await createTasks.execute(params);
        } catch (ex) {
            return response.error(ex.message ?? "Error while executing MoveEntriesToFolderByModel");
        }
    }
}
