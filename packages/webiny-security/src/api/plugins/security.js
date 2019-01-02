// @flow
import type { PluginType } from "webiny-plugins/types";
import authenticate from "./authentication/authenticate";
import { getPlugins } from "webiny-plugins";
import { shield } from "graphql-shield";

export default ([
    {
        type: "graphql-middleware",
        name: "graphql-middleware-security",
        middleware: () => {
            const middleware = [];
            getPlugins("graphql").forEach(plugin => {
                plugin.security && middleware.push(shield(plugin.security));
            });

            return middleware;
        }
    },
    { type: "security", name: "security", authenticate }
]: Array<PluginType>);
