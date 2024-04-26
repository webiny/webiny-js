import { ITaskResponseResult } from "@webiny/tasks";
import { ProcessPublishEntriesTasks } from "./ProcessPublishEntriesTasks";
import { CreatePublishEntriesTasks } from "./CreatePublishEntriesTasks";
import { IPublishEntriesByModelTaskParams } from "~/types";
import { IUseCase } from "~/tasks/IUseCase";

export class PublishEntriesByModel
    implements IUseCase<IPublishEntriesByModelTaskParams, ITaskResponseResult>
{
    public async execute(params: IPublishEntriesByModelTaskParams) {
        const { input, response } = params;

        try {
            if (!input.modelId) {
                return response.error(`Missing "modelId" in the input.`);
            }

            if (input.processing) {
                const processPublishEntriesTasks = new ProcessPublishEntriesTasks();
                return await processPublishEntriesTasks.execute(params);
            }

            const createPublishEntriesTasks = new CreatePublishEntriesTasks();
            return await createPublishEntriesTasks.execute(params);
        } catch (ex) {
            return response.error(ex.message ?? "Error while executing PublishEntriesByModel");
        }
    }
}
