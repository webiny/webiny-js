import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { EntryBulkAction } from "~/features/EntryBulkAction/abstractions.js";
import { Result } from "./Result.js";
import type {
    IBulkActionOperationInput,
    IBulkActionOperationOutput,
    IBulkActionOperationTaskParams
} from "~/types.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

/**
 * The `ProcessTask` class is responsible for processing a batch of entries
 * based on the provided parameters. It uses a gateway to perform the actual
 * processing and maintains the results of the operations, including successfully
 * processed and failed entries.
 */
export class ProcessTask {
    private readonly result: Result;

    constructor(
        private bulkAction: EntryBulkAction.Interface,
        private getModel: GetModelUseCase.Interface
    ) {
        this.result = new Result();
    }

    async execute({
        input,
        controller
    }: IBulkActionOperationTaskParams): Promise<
        TaskDefinition.Result<IBulkActionOperationInput, IBulkActionOperationOutput>
    > {
        try {
            if (controller.runtime.isAborted()) {
                return controller.response.aborted();
            } else if (controller.runtime.isCloseToTimeout()) {
                return controller.response.continue({
                    ...input
                });
            }

            // Check if the input contains a model ID.
            if (!input.modelId) {
                return controller.response.error(`Missing "modelId" in the input.`);
            }

            // Check if the model exists.
            const modelResult = await this.getModel.execute(input.modelId);

            if (modelResult.isFail()) {
                return controller.response.error(`Model with ${input.modelId} not found!`);
            }

            const model = modelResult.value;

            // Check if there are any IDs to process.
            if (!input.ids || input.ids.length === 0) {
                return controller.response.done(
                    `Task done: no entries to process for "${input.modelId}" model.`,
                    {
                        done: [],
                        failed: []
                    }
                );
            }

            // Process each ID in the input.
            for (const id of input.ids) {
                try {
                    // Execute the gateway operation for the current ID.
                    await this.bulkAction.processData({
                        model,
                        id,
                        data: input.data
                    });

                    // Add the ID to the list of successfully processed entries.
                    this.result.addDone(id);
                } catch (ex) {
                    console.error(ex.message || `Failed to process entry with id "${id}".`);
                    // Add the ID to the list of failed entries.
                    this.result.addFailed(id);
                }
            }

            // Return a done response with the results of the processing.
            return controller.response.done(
                `Task done: all entries processed for "${model.name}" model.`,
                {
                    done: this.result.getDone(),
                    failed: this.result.getFailed()
                }
            );
        } catch (ex) {
            return controller.response.error(ex.message ?? `Error while processing task.`);
        }
    }
}
