import { GraphQLClient } from "@webiny/app/features/graphqlClient/index.js";
import { InternalIdTokenProvider } from "~/features/security/AuthenticationContext/abstractions.js";

class GraphQLClientWithIdToken implements GraphQLClient.Interface {
    constructor(
        private idTokenProvider: InternalIdTokenProvider.Interface,
        private decoratee: GraphQLClient.Interface
    ) {}

    async execute<TVariables = any, TResult = any>(
        params: GraphQLClient.Request<TVariables>
    ): Promise<TResult> {
        const idToken = await this.idTokenProvider.getTokenProvider()();

        const authHeaders = idToken ? { Authorization: `Bearer ${idToken}` } : {};

        return this.decoratee.execute({
            ...params,
            headers: { ...params.headers, ...authHeaders }
        });
    }
}

export const GraphQLClientDecorator = GraphQLClient.createDecorator({
    decorator: GraphQLClientWithIdToken,
    dependencies: [InternalIdTokenProvider]
});
