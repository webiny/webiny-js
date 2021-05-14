import { interceptConsole } from "./interceptConsole";
import { GraphQLAfterQueryPlugin, GraphQLBeforeQueryPlugin } from "./types";
import { ContextInterface, ContextPlugin } from "@webiny/handler/types";

interface DebugContext extends ContextInterface {
    debug: {
        logs?: { method: string; args: any }[];
    };
}

export default () => [
    {
        type: "context",
        apply(context) {
            context.debug = context.debug || {};
            context.debug.logs = [];
            interceptConsole((method, args) => {
                context.debug.logs.push({ method, args });
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
