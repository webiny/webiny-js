import { ITaskResponseResult } from "@webiny/tasks";
import { ProcessDeleteEntriesTasks } from "./ProcessDeleteEntriesTasks";
import { CreateDeleteEntriesTasks } from "./CreateDeleteEntriesTasks";
import { IEmptyTrashBinByModelTaskParams } from "~/types";
import { IUseCase } from "~/tasks/IUseCase";

export class EmptyTrashBinByModel
    implements IUseCase<IEmptyTrashBinByModelTaskParams, ITaskResponseResult>
{
    public async execute(params: IEmptyTrashBinByModelTaskParams) {
        const { input, response } = params;

        try {
            if (input.processing) {
                const processDeleteEntriesTasks = new ProcessDeleteEntriesTasks();
                return await processDeleteEntriesTasks.execute(params);
            }

            const createDeleteEntriesTasks = new CreateDeleteEntriesTasks();
            return await createDeleteEntriesTasks.execute(params);
        } catch (ex) {
            return response.error(ex.message ?? "Error while executing EmptyTrashBinByModel");
        }
    }
}
