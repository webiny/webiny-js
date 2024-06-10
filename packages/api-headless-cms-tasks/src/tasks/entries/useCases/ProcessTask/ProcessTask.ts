import { Result } from "./Result";
import { IProcessEntry } from "~/tasks/entries/gateways";
import { IBulkActionOperationTaskParams } from "~/types";

export class ProcessTask {
    private readonly result: Result;
    private gateway: IProcessEntry;

    constructor(gateway: IProcessEntry) {
        this.result = new Result();
        this.gateway = gateway;
    }

    async execute(params: IBulkActionOperationTaskParams) {
        const { input, response, isAborted, isCloseToTimeout, context, store } = params;

        try {
            if (isAborted()) {
                return response.aborted();
            } else if (isCloseToTimeout()) {
                return response.continue({
                    ...input
                });
            }

            if (!input.modelId) {
                return response.error(`Missing "modelId" in the input.`);
            }

            if (!input.identity) {
                return response.error(`Missing "identity" in the input.`);
            }

            const model = await context.cms.getModel(input.modelId);

            if (!model) {
                return response.error(`Model with ${input.modelId} not found!`);
            }

            if (!input.ids || input.ids.length === 0) {
                return response.done("Task done: no entries to process.");
            }

            for (const id of input.ids) {
                try {
                    context.security.setIdentity(input.identity);
                    await this.gateway.execute(context, model, id, input.data);
                    this.result.addDone(id);
                } catch (ex) {
                    const message = ex.message || `Failed to process entry with id "${id}".`;
                    try {
                        console.error(message);
                        await store.addErrorLog({
                            message,
                            error: ex
                        });
                    } catch {
                        console.error(`Failed to add error log: "${message}"`);
                    } finally {
                        this.result.addFailed(id);
                    }
                }
            }

            return response.done("Task done.", {
                done: this.result.getDone(),
                failed: this.result.getFailed()
            });
        } catch (ex) {
            // Handle errors that occur during task processing
            return response.error(ex.message ?? `Error while processing task.`);
        }
    }
}
