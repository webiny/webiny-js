import { GraphQLClient } from "~/features/graphqlClient/abstractions.js";
import { ApiRequestHeadersResolver } from "./abstractions.js";

class GraphQLClientWithApiRequestHeaders implements GraphQLClient.Interface {
    constructor(
        private resolver: ApiRequestHeadersResolver.Interface,
        private decoratee: GraphQLClient.Interface
    ) {}

    async execute<TResult = any, TVariables = any>(
        params: GraphQLClient.Request<TVariables>
    ): Promise<TResult> {
        const headers = await this.resolver.resolve();
        return this.decoratee.execute({ ...params, headers: { ...headers, ...params.headers } });
    }
}

export const GraphQLClientDecorator = GraphQLClient.createDecorator({
    decorator: GraphQLClientWithApiRequestHeaders,
    dependencies: [ApiRequestHeadersResolver]
});
