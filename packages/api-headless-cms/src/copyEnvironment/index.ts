import { applyGraphQLContextPlugins } from "@webiny/graphql/createSchema/contextPlugins";
import headlessPlugins from "../handler/plugins";
import { copyEnvironment } from "./copyEnvironment";
import { HttpHandlerPlugin } from "@webiny/http-handler/types";

export default () => [
    {
        type: "before-handler",
        name: "before-handler-setup-headless-plugins",
        async handle({ args, context }) {
            const [event] = args;
            const { copyFrom } = event;
            context.plugins.register(
                await headlessPlugins({ type: "manage", environment: copyFrom })
            );
        }
    },
    {
        type: "handler",
        name: "handler-copy-environment",
        canHandle() {
            return true;
        },
        async handle({ args, context }) {
            const [event] = args;
            const { copyTo } = event;
            await applyGraphQLContextPlugins(context);
            return await copyEnvironment(copyTo, context);
        }
    } as HttpHandlerPlugin
];
