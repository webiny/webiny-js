// @flow
import type { PluginType } from "webiny-plugins/types";
import authenticate from "./authentication/authenticate";
import { getPlugins } from "webiny-plugins";
import { shield } from "graphql-shield";

export default ([
    {
        type: "graphql-middleware",
        name: "graphql-middleware-shield",
        middleware: () => {
            const middleware = [];
            getPlugins("graphql").forEach(plugin => {
                plugin.shield && middleware.push(shield(plugin.shield));
            });

            return middleware;
        }
    },
    { type: "security", name: "security", authenticate }
]: Array<PluginType>);
