import { DbProxyDriver, id, isId, withId } from "@webiny/commodo-fields-storage-db-proxy";
import {GraphQLBeforeSchemaPlugin, GraphQLContextPlugin} from "@webiny/api/types";

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

export default (options) => [
    {
        name: "graphql-context-commodo",
        type: "graphql-context",
        preApply(context) {
            return apply(context, options);
        }
    } as GraphQLContextPlugin,
    {
        name: "before-schema-commodo",
        type: "before-schema",
        apply(context) {
            return apply(context, options);
        }
    } as GraphQLBeforeSchemaPlugin
];
