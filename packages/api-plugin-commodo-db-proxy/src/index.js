import { DbProxyDriver, id, isId, withId } from "@webiny/commodo-fields-storage-db-proxy";

export default options => ({
    name: "graphql-context-commodo",
    type: "graphql-context",
    async preApply(context) {
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
});
