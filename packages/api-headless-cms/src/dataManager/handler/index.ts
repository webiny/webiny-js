import { applyContextPlugins } from "@webiny/graphql";
import { HandlerPlugin } from "@webiny/handler/types";
import { createResponse } from "@webiny/handler";
import headlessPlugins from "../../handler/plugins";
import { generateContentModelIndexes } from "./generateContentModelIndexes";
import { generateRevisionIndexes } from "./generateRevisionIndexes";
import { deleteEnvironmentData } from "./deleteEnvironmentData";
import { Action } from "../types";
import { copyEnvironment } from "./copyEnvironment";

export default () => [
    {
        type: "handler",
        name: "handler-data-manager",
        async handle({ args, context }) {
            const [event] = args;
            const { operation, environment } = event;

            // Setup plugins for given environment
            context.plugins.register(await headlessPlugins({ type: "manage", environment }));

            // Initialize context
            await applyContextPlugins(context);

            const { action, ...params } = operation;

            try {
                let result;
                switch (action as Action) {
                    case "deleteEnvironment":
                        result = await deleteEnvironmentData({ context, ...params });
                        break;
                    case "generateContentModelIndexes":
                        if (!params.contentModel) {
                            throw Error(`[${action}] Missing required parameters "contentModel"!`);
                        }
                        result = await generateContentModelIndexes({ context, ...params });
                        break;
                    case "generateRevisionIndexes":
                        if (!params.contentModel || !params.revision) {
                            throw Error(
                                `[${action}] Missing required parameters "contentModel" and "revision"!`
                            );
                        }
                        result = await generateRevisionIndexes({ context, ...params });
                        break;
                    case "copyEnvironment":
                        if (!params.copyFrom || !params.copyTo) {
                            throw Error(
                                `[${action}] Missing required parameters "copyFrom" and "copyTo"!`
                            );
                        }
                        result = await copyEnvironment({ context, ...params });
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
