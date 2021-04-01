import { HandlerPlugin, QueueAddHookPlugin } from "./types";
import { TYPE, DbQueueJob } from "../../types";
import { HandlerResponse } from "../../types";
import mdbid from "mdbid";

export default (): HandlerPlugin => ({
    type: "handler",
    async handle(context): Promise<HandlerResponse> {
        const log = console.log;
        const { invocationArgs } = context;
        const handlerArgs = Array.isArray(invocationArgs) ? invocationArgs : [invocationArgs];
        const handlerHookPlugins = context.plugins.byType<QueueAddHookPlugin>("ps-queue-add-hook");

        log("Received args: ", JSON.stringify(invocationArgs));

        try {
            for (let i = 0; i < handlerArgs.length; i++) {
                const args = handlerArgs[i];

                for (let j = 0; j < handlerHookPlugins.length; j++) {
                    const plugin = handlerHookPlugins[j];
                    if (typeof plugin.beforeAdd === "function") {
                        await plugin.beforeAdd({
                            context,
                            args,
                            log
                        });
                    }
                }

                log("Saving new queue job.");

                const data: DbQueueJob = {
                    PK: "PS#Q#JOB",
                    SK: mdbid(),
                    TYPE: TYPE.DbQueueJob,
                    args
                };

                await context.db.create({ data });

                log("Queue job saved.", JSON.stringify(invocationArgs));

                for (let j = 0; j < handlerHookPlugins.length; j++) {
                    const plugin = handlerHookPlugins[j];
                    if (typeof plugin.afterAdd === "function") {
                        await plugin.afterAdd({
                            context,
                            args,
                            log
                        });
                    }
                }
            }

            return { data: null, error: null };
        } catch (e) {
            log("An error occurred while trying to add to prerendering queue...", e);
            return { data: null, error: e };
        }
    }
});
