import { DbProxyDriver, id, isId, withId } from "@webiny/commodo-fields-storage-db-proxy";
import { ContextPlugin } from "@webiny/graphql/types";
import { HandlerClientContext } from "@webiny/handler-client";
import { HandlerContext } from "@webiny/handler/types";

interface DbProxyOptions {
    functionName: string;
}

export default (options: DbProxyOptions) => [
    {
        name: "context-commodo",
        type: "context",
        apply(context: HandlerContext & HandlerClientContext) {
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
            context.commodo.driver = new DbProxyDriver({
                context,
                dbProxyFunction: options.functionName
            });
        }
    } as ContextPlugin
];
