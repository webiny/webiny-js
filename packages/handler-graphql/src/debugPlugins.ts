import { interceptConsole } from "./interceptConsole";

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
    },
    {
        type: "handler-graphql-before-query",
        apply(context) {
            // Empty logs
            context.debug.logs = [];
        }
    },
    {
        type: "handler-graphql-after-query",
        apply(result, context) {
            result["extensions"] = { console: context.debug.logs || [] };
        }
    }
];
