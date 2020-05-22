import { applyContextPlugins } from "@webiny/graphql";
import { HandlerPlugin } from "@webiny/handler/types";
import { createResponse } from "@webiny/handler";
import headlessPlugins from "../../handler/plugins";
import { generateContentModelIndexes } from "./generateContentModelIndexes";
import { generateRevisionIndexes } from "./generateRevisionIndexes";
import { deleteEnvironmentData } from "./deleteEnvironmentData";
import { Action } from "../types";
import { copyEnvironment } from "./copyEnvironment";

// Setup plugins for given environment
async function setupEnvironment(context, environment) {
    context.plugins.register(await headlessPlugins({ type: "manage", environment }));
    await applyContextPlugins(context);
}

export default () => [
    {
        type: "handler",
        name: "handler-data-manager",
        async handle({ args, context }) {
            const [event] = args;
            const { environment, action, ...params } = event;

            try {
                let result;
                switch (action as Action) {
                    case "generateContentModelIndexes":
                        if (!params.contentModel) {
                            throw Error(`[${action}] Missing required parameters "contentModel"!`);
                        }

                        await setupEnvironment(context, environment);

                        result = await generateContentModelIndexes({ context, ...params });
                        break;
                    case "generateRevisionIndexes":
                        if (!params.contentModel || !params.revision) {
                            throw Error(
                                `[${action}] Missing required parameters "contentModel" and "revision"!`
                            );
                        }

                        await setupEnvironment(context, environment);

                        result = await generateRevisionIndexes({ context, ...params });
                        break;
                    case "copyEnvironment":
                        if (!params.copyFrom || !params.copyTo) {
                            throw Error(
                                `[${action}] Missing required parameters "copyFrom" and "copyTo"!`
                            );
                        }

                        await applyContextPlugins(context);

                        result = await copyEnvironment({ context, ...params });
                        break;
                    case "deleteEnvironment":
                        await applyContextPlugins(context);

                        result = await deleteEnvironmentData({ context, environment });
                        break;
                    default:
                        throw Error(`Unknown action "${action}"!`);
                }

                return createResponse({
                    type: "application/json",
                    body: JSON.stringify({ action, result })
                });
            } catch (err) {
                console.log(err);
                throw err;
            }
        }
    } as HandlerPlugin
];
