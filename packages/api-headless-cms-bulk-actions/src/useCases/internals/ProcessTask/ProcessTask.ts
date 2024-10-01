import { Result } from "./Result";
import { IBulkActionOperationTaskParams } from "~/types";
import { IProcessEntry } from "~/abstractions";

/**
 * The `ProcessTask` class is responsible for processing a batch of entries
 * based on the provided parameters. It uses a gateway to perform the actual
 * processing and maintains the results of the operations, including successfully
 * processed and failed entries.
 */
export class ProcessTask {
    private readonly result: Result;
    private gateway: IProcessEntry;

    constructor(gateway: IProcessEntry) {
        this.result = new Result();
        this.gateway = gateway;
    }

    async execute(params: IBulkActionOperationTaskParams) {
        const { input, response, isAborted, isCloseToTimeout, context } = params;

        try {
            if (isAborted()) {
                return response.aborted();
            } else if (isCloseToTimeout()) {
                return response.continue({
                    ...input
                });
            }

            // Check if the input contains a model ID.
            if (!input.modelId) {
                return response.error(`Missing "modelId" in the input.`);
            }

            // Check if the model exists.
            const model = await context.cms.getModel(input.modelId);

            if (!model) {
                return response.error(`Model with ${input.modelId} not found!`);
            }

            // Check if there are any IDs to process.
            if (!input.ids || input.ids.length === 0) {
                return response.done(
                    `Task done: no entries to process for "${input.modelId}" model.`
                );
            }

            // Set the security identity in the context.
            context.security.setIdentity(input.identity);

            // Process each ID in the input.
            for (const id of input.ids) {
                try {
                    // Execute the gateway operation for the current ID.
                    await this.gateway.execute(model, id, input.data);
                    // Add the ID to the list of successfully processed entries.
                    this.result.addDone(id);
                } catch (ex) {
                    console.error(ex.message || `Failed to process entry with id "${id}".`);
                    // Add the ID to the list of failed entries.
                    this.result.addFailed(id);
                }
            }

            // Return a done response with the results of the processing.
            return response.done(`Task done: all entries processed for "${model.name}" model.`, {
                done: this.result.getDone(),
                failed: this.result.getFailed()
            });
        } catch (ex) {
            return response.error(ex.message ?? `Error while processing task.`);
        }
    }
}
