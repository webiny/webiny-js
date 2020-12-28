import log from "@webiny/api-prerendering-service/utils/log";
import { HandlerPlugin, ProcessHookPlugin } from "./types";
import { HandlerResponse } from "@webiny/api-prerendering-service/types";

const LOG_PREFIX = "queue:process";

export default (): HandlerPlugin => ({
    type: "handler",
    async handle(context): Promise<HandlerResponse> {
        const handlerHookPlugins = context.plugins.byType<ProcessHookPlugin>(
            "ps-queue-process-hook"
        );

        try {
            const promises = [];
            const tasks = [];
            for (let i = 0; i < tasks.length; i++) {
                const task = tasks[i];

                promises.push(
                    new Promise(async resolve => {
                        for (let j = 0; j < handlerHookPlugins.length; j++) {
                            const plugin = handlerHookPlugins[j];
                            if (typeof plugin.beforeProcess === "function") {
                                await plugin.beforeProcess({
                                    context
                                });
                            }
                        }

                        // TODO: do something...
                        console.log(task);

                        for (let j = 0; j < handlerHookPlugins.length; j++) {
                            const plugin = handlerHookPlugins[j];
                            if (typeof plugin.afterProcess === "function") {
                                await plugin.afterProcess({
                                    context
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
            log(
                LOG_PREFIX,
                "An error occurred while trying to process to prerendering queue...",
                e
            );
            return { data: null, error: e };
        }
    }
});
