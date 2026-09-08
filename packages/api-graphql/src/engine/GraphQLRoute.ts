import { HttpRouteDefinition, HttpRouteHandler } from "@webiny/event-handler-core";
import { GraphQLEngine } from "./abstractions.js";
import type { IHttpRequest, IHttpResponse } from "@webiny/event-handler-core";
import type { IGraphQLEngine } from "./abstractions.js";

class GraphQLRouteImpl implements HttpRouteHandler.Interface {
    constructor(private engine: IGraphQLEngine) {}

    async handle(request: IHttpRequest): Promise<IHttpResponse> {
        const result = await this.engine.execute(request.body);
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
    readonly method = "POST";
    readonly path = "/graphql";
    readonly handler = GraphQLRoute;
}

/** What the router matches on. Zero dependencies, so building it costs nothing. */
export const GraphQLRouteDefinition = HttpRouteDefinition.createImplementation({
    implementation: GraphQLRouteDefinitionImpl,
    dependencies: []
});
