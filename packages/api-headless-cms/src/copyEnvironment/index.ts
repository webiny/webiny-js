import { applyContextPlugins } from "@webiny/graphql/createSchema/contextPlugins";
import { HandlerPlugin } from "@webiny/handler/types";
import headlessPlugins from "../handler/plugins";
import { copyEnvironment } from "./copyEnvironment";

export default () => [
    {
        type: "handler",
        name: "handler-copy-environment",
        async handle({ args, context }) {
            const [event] = args;
            const { copyFrom, copyTo } = event;

            context.plugins.register(
              await headlessPlugins({ type: "manage", environment: copyFrom })
            );

            await applyContextPlugins(context);
            return await copyEnvironment(copyTo, context);
        }
    } as HandlerPlugin
];
