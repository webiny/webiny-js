import { ApolloGateway } from "@apollo/gateway";
import { boolean } from "boolean";
import { HandlerContext } from "@webiny/handler/types";
import { HandlerHttpContext } from "@webiny/handler-http/types";
import { HandlerClientContext } from "@webiny/handler-client/types";
import { HandlerApolloGatewayServicePlugin } from "./../types";
import { runHttpQuery } from "apollo-server-core/dist/runHttpQuery";
import { generateSchemaHash } from "apollo-server-core/dist/utils/schemaHash";
import { Headers } from "apollo-server-env";
import HandlerGraphQLDataSource from "./HandlerGraphQLDataSource";

class ApolloGatewayError extends Error {
    errors: any[];
    constructor(errors) {
        super("");
        this.errors = errors;
    }
}

let cache = null;

type Context = HandlerContext & HandlerHttpContext & HandlerClientContext;

export default async (context: Context, options) => {
    if (cache) {
        return cache;
    }

    const servicePlugins = context.plugins.byType<HandlerApolloGatewayServicePlugin>(
        "handler-apollo-gateway-service"
    );

    if (!servicePlugins.length) {
        throw Error(`Missing "handler-apollo-gateway-service" plugins!`);
    }

    const dataSourceErrors = [];

    const services = servicePlugins.map(pl => {
        return { ...pl.service, url: pl.service.name };
    });

    const gateway = new ApolloGateway({
        debug: boolean(options.debug),
        serviceList: services,
        buildService({ name }) {
            return new HandlerGraphQLDataSource({
                context,
                functionName: services.find(s => s.name === name).function
            });
        }
    });

    if (dataSourceErrors.length > 0) {
        throw new ApolloGatewayError(dataSourceErrors);
    }

    const { schema, executor } = await gateway.load();
    const schemaHash = generateSchemaHash(schema);

    // Create handler.
    cache = function(query, context) {
        return runHttpQuery([], {
            method: "POST",
            query,
            options: { schema, schemaHash, context, executor },
            request: {
                url: context.http.path.base,
                method: context.http.method,
                headers: new Headers(context.http.headers)
            }
        });
    };

    return cache;
};
