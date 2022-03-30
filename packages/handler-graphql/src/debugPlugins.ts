import { interceptConsole } from "./interceptConsole";
import { GraphQLAfterQueryPlugin, GraphQLBeforeQueryPlugin } from "./types";
import { Context, ContextPlugin } from "@webiny/handler/types";

interface Log {
    method: string;
    args: any;
}
interface DebugContext extends Context {
    debug: {
        logs?: Log[];
    };
}

export default () => [
    {
        type: "context",
        apply(context) {
            if (!context.debug) {
                context.debug = {};
            }

            // Reset logs.
            context.debug.logs = [];

            interceptConsole((method, args) => {
                (context.debug.logs as Log[]).push({ method, args });
            });
        }
    } as ContextPlugin<DebugContext>,
    {
        type: "graphql-before-query",
        apply({ context }) {
            // Empty logs
            context.debug.logs = [];
        }
    } as GraphQLBeforeQueryPlugin<DebugContext>,
    {
        type: "graphql-after-query",
        apply({ result, context }) {
            result["extensions"] = { console: context.debug.logs || [] };
        }
    } as GraphQLAfterQueryPlugin<DebugContext>
];
