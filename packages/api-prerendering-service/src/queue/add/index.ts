/**
 * Package mdbid does not have types.
 */
// @ts-ignore
import mdbid from "mdbid";
import { QueueAddJobEvent } from "./types";
import { PrerenderingServiceStorageOperations, QueueJob } from "~/types";
import { HandlerPlugin } from "@webiny/handler";
import { ArgsContext } from "@webiny/handler-args/types";
import { Context } from "@webiny/handler/types";

interface HandlerContext extends Context, ArgsContext<QueueAddJobEvent> {}

export interface CreateQueueAddParams {
    storageOperations: PrerenderingServiceStorageOperations;
}

export default (params: CreateQueueAddParams) => {
    const { storageOperations } = params;

    return new HandlerPlugin<HandlerContext>(async context => {
        const log = console.log;
        const { invocationArgs } = context;
        const handlerArgs = Array.isArray(invocationArgs) ? invocationArgs : [invocationArgs];

        log("Received args: ", JSON.stringify(invocationArgs));

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

                log("Queue job saved.", JSON.stringify(invocationArgs));
            }

            return { data: null, error: null };
        } catch (e) {
            log("An error occurred while trying to add to prerendering queue...", e);
            return { data: null, error: e };
        }
    });
};
