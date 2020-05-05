import { DbProxyDriver, id, isId, withId } from "@webiny/commodo-fields-storage-db-proxy";
import { ContextPlugin } from "@webiny/graphql/types";

function apply(context, options) {
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
    context.commodo.driver = new DbProxyDriver({ dbProxyFunctionName: options.functionArn });
}

export default options => [
    {
        name: "context-commodo",
        type: "context",
        preApply(context) {
            return apply(context, options);
        }
    } as ContextPlugin
];
