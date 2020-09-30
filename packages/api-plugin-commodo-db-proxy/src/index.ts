import { DbProxyDriver, id, isId, withId } from "@webiny/commodo-fields-storage-db-proxy";
import { ContextPlugin } from "@webiny/graphql/types";

function apply(context, options: DbProxyOptions) {
    if (!context.commodo) {
        context.commodo = {
            isId,
            withId
        };
    }

    if (!context.commodo.fields) {
        context.commodo.fields = {};
    }

    context.commodo.fields.id = id;
    context.commodo.driver = new DbProxyDriver({ dbProxyFunction: options.functionName });
}

interface DbProxyOptions {
    functionName: string;
}

export default (options: DbProxyOptions) => [
    {
        name: "context-commodo",
        type: "context",
        apply(context) {
            return apply(context, options);
        }
    } as ContextPlugin
];
