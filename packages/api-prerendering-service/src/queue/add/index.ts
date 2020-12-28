import log from "./../../utils/log";
import { HandlerPlugin, Configuration, addHookPlugin } from "./types";
import { HandlerResponse } from "@webiny/api-prerendering-service/types";

const LOG_PREFIX = "queue:add";

export default (configuration?: Configuration): HandlerPlugin => ({
    type: "handler",
    async handle(context): Promise<HandlerResponse> {
        const { invocationArgs } = context;
        const handlerArgs = Array.isArray(invocationArgs) ? invocationArgs : [invocationArgs];
        const handlerHookPlugins = context.plugins.byType<addHookPlugin>("ps-queue-add-hook");

        const promises = [];

        log(LOG_PREFIX, "Received args: ", JSON.stringify(invocationArgs));

        try {
            for (let i = 0; i < handlerArgs.length; i++) {
                const args = handlerArgs[i];

                promises.push(
                    new Promise(async resolve => {
                        for (let j = 0; j < handlerHookPlugins.length; j++) {
                            const plugin = handlerHookPlugins[j];
                            if (typeof plugin.beforeAdd === "function") {
                                await plugin.beforeAdd({
                                    context,
                                    configuration,
                                    args
                                });
                            }
                        }

                        // TODO: do something...

                        for (let j = 0; j < handlerHookPlugins.length; j++) {
                            const plugin = handlerHookPlugins[j];
                            if (typeof plugin.afterAdd === "function") {
                                await plugin.afterAdd({
                                    context,
                                    configuration,
                                    args
                                });
                            }
                        }

                        resolve();
                    })
                );
            }

            await Promise.all(promises);

            return { data: null, error: null };
        } catch (e) {
            log(LOG_PREFIX, "An error occurred while trying to add to prerendering queue...", e);
            return { data: null, error: e };
        }
    }
});
