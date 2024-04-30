import { ITaskResponseResult } from "@webiny/tasks";
import { ProcessTasks } from "./ProcessTasks";
import { CreateTasks } from "./CreateTasks";
import { IUnpublishEntriesByModelTaskParams } from "~/types";
import { IUseCase } from "~/tasks/IUseCase";

export class UnpublishEntriesByModel
    implements IUseCase<IUnpublishEntriesByModelTaskParams, ITaskResponseResult>
{
    public async execute(params: IUnpublishEntriesByModelTaskParams) {
        const { input, response } = params;

        try {
            if (!input.modelId) {
                return response.error(`Missing "modelId" in the input.`);
            }

            if (input.processing) {
                const processTasks = new ProcessTasks();
                return await processTasks.execute(params);
            }

            const createTasks = new CreateTasks();
            return await createTasks.execute(params);
        } catch (ex) {
            return response.error(ex.message ?? "Error while executing UnpublishEntriesByModel");
        }
    }
}
