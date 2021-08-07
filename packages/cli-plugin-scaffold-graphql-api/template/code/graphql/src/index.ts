import { createHandler } from "@webiny/handler-aws";
import graphqlPlugins from "@webiny/handler-graphql";
import logsPlugins from "@webiny/handler-logs";

// Imports plugins created via scaffolding utilities.
import scaffoldsPlugins from "./plugins/scaffolds";

const debug = process.env.DEBUG === "true";

export const handler = createHandler({
    plugins: [logsPlugins(), graphqlPlugins({ debug }), scaffoldsPlugins()],
    http: { debug }
});
