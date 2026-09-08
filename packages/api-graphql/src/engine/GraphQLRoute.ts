import { HttpRoute, HttpRouteDefinition, HttpRouteHandler } from "@webiny/event-handler-core";
import { GraphQLEngine } from "./abstractions.js";
import type { IHttpRequest, IHttpResponse } from "@webiny/event-handler-core";
import type { IGraphQLEngine } from "./abstractions.js";

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

export const GraphQLRoute = HttpRouteHandler.createImplementation({
    implementation: GraphQLRouteImpl,
    dependencies: [GraphQLEngine]
});

/** What the router matches on. Plain data — reading it builds nothing. */
export const GraphQLRouteDefinition: HttpRouteDefinition.Interface = {
    method: "POST",
    path: "/graphql",
    handler: GraphQLRoute
};
