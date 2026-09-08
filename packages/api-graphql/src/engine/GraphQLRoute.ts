import { HttpRoute, HttpRouteDefinition } from "@webiny/event-handler-core";
import { GraphQLEngine } from "./abstractions.js";
import type { IHttpRequest, IHttpResponse } from "@webiny/event-handler-core";
import type { IGraphQLEngine } from "./abstractions.js";
import { createAbstraction } from "@webiny/feature/api";

class GraphQLRouteImpl implements HttpRoute.Interface {
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

/** Its own abstraction, so the router can resolve THIS route and only this route. */
export const GraphQLRouteHandler = createAbstraction<HttpRoute.Interface>("GraphQLRouteHandler");

export const GraphQLRoute = GraphQLRouteHandler.createImplementation({
    implementation: GraphQLRouteImpl,
    dependencies: [GraphQLEngine]
});

/** What the router matches on. Plain data — reading it builds nothing. */
export const GraphQLRouteDefinition: HttpRouteDefinition.Interface = {
    method: "POST",
    path: "/graphql",
    handler: GraphQLRouteHandler
};
