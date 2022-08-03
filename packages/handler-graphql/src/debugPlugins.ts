import { interceptConsole } from "./interceptConsole";
import { GraphQLAfterQueryPlugin } from "./types";
import { Context } from "@webiny/api/types";
import { ContextPlugin } from "@webiny/api";

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
    new ContextPlugin<DebugContext>(async context => {
        if (!context.debug) {
            context.debug = {};
        }

        if (!context.debug.logs) {
            context.debug.logs = [];
        }

        interceptConsole((method, args) => {
            (context.debug.logs as Log[]).push({ method, args });
        });
    }),
    {
        type: "graphql-after-query",
        apply({ result, context }) {
            result["extensions"] = { console: [...(context.debug.logs || [])] };
            if (context.debug.logs) {
                context.debug.logs.length = 0;
            }
        }
    } as GraphQLAfterQueryPlugin<DebugContext>
];
