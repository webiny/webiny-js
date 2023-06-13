import { QueueAddJobEvent } from "./types";
import { PrerenderingServiceStorageOperations, QueueJob } from "~/types";
import { EventPlugin } from "@webiny/handler";
import { mdbid } from "@webiny/utils";

export interface CreateQueueAddParams {
    storageOperations: PrerenderingServiceStorageOperations;
}

export default (params: CreateQueueAddParams) => {
    const { storageOperations } = params;

    return new EventPlugin<QueueAddJobEvent>(async ({ payload }) => {
        const log = console.log;
        const handlerArgs = Array.isArray(payload) ? payload : [payload];

        log("Received args: ", JSON.stringify(payload));

        try {
            for (let i = 0; i < handlerArgs.length; i++) {
                const args = handlerArgs[i];

                log("Saving new queue job.");

                const queueJob: QueueJob = {
                    id: mdbid(),
                    args
                };

                await storageOperations.createQueueJob({
                    queueJob
                });

                log("Queue job saved.", JSON.stringify(payload));
            }

            return {
                data: null,
                error: null
            };
        } catch (ex) {
            console.error("An error occurred while trying to add to prerendering queue...", ex);
            return {
                data: null,
                error: ex
            };
        }
    });
};
