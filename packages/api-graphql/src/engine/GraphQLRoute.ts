import { HttpRouteDefinition, HttpRouteHandler } from "@webiny/api-kernel-core";
import { GraphQLEngine } from "./abstractions.js";
import type { IHttpRequest, IHttpResponse } from "@webiny/api-kernel-core";
import type { IGraphQLEngine } from "./abstractions.js";
import {
    invalidRequestBodyResponse,
    isJsonContentType,
    unsupportedMediaTypeResponse
} from "~/jsonContentType.js";

class GraphQLRouteImpl implements HttpRouteHandler.Interface {
    constructor(private engine: IGraphQLEngine) {}

    async handle(request: IHttpRequest): Promise<IHttpResponse> {
        if (!isJsonContentType(request)) {
            return unsupportedMediaTypeResponse();
        }

        let result: unknown;
        try {
            result = await this.engine.execute(request.body);
        } catch (ex) {
            const response = invalidRequestBodyResponse(ex);
            if (response) {
                return response;
            }
            throw ex;
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: result
        };
    }
}

export const GraphQLRoute = HttpRouteHandler.createImplementation({
    implementation: GraphQLRouteImpl,
    dependencies: [GraphQLEngine]
});

class GraphQLRouteDefinitionImpl implements HttpRouteDefinition.Interface {
    readonly name = "graphql";
    readonly method = "POST";
    readonly path = "/graphql";
    readonly handler = GraphQLRoute;
}

/** What the router matches on. Zero dependencies, so building it costs nothing. */
export const GraphQLRouteDefinition = HttpRouteDefinition.createImplementation({
    implementation: GraphQLRouteDefinitionImpl,
    dependencies: []
});
