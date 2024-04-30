import { ITaskResponseResult } from "@webiny/tasks";
import { ProcessTasks } from "./ProcessTasks";
import { CreateTasks } from "./CreateTasks";
import { IRestoreEntriesFromTrashByModelTaskParams } from "~/types";
import { IUseCase } from "~/tasks/IUseCase";

export class RestoreEntriesFromTrashByModel
    implements IUseCase<IRestoreEntriesFromTrashByModelTaskParams, ITaskResponseResult>
{
    public async execute(params: IRestoreEntriesFromTrashByModelTaskParams) {
        const { input, response } = params;

        try {
            if (input.processing) {
                const processTasks = new ProcessTasks();
                return await processTasks.execute(params);
            }

            const createTasks = new CreateTasks();
            return await createTasks.execute(params);
        } catch (ex) {
            return response.error(
                ex.message ?? "Error while executing RestoreEntriesFromTrashByModel"
            );
        }
    }
}
