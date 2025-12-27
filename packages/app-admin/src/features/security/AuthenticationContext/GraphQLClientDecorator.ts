import { GraphQLClient } from "@webiny/app/features/graphqlClient/index.js";
import { AuthenticationContext } from "~/features/security/AuthenticationContext/abstractions.js";

class GraphQLClientWithIdToken implements GraphQLClient.Interface {
    constructor(
        private context: AuthenticationContext.Interface,
        private decoratee: GraphQLClient.Interface
    ) {}

    async execute<TVariables = any, TResult = any>(
        params: GraphQLClient.Request<TVariables>
    ): Promise<TResult> {
        const idToken = await this.context.getIdToken();

        const authHeaders = idToken ? { Authorization: `Bearer ${idToken}` } : {};

        return this.decoratee.execute({
            ...params,
            headers: { ...params.headers, ...authHeaders }
        });
    }
}

export const GraphQLClientDecorator = GraphQLClient.createDecorator({
    decorator: GraphQLClientWithIdToken,
    dependencies: [AuthenticationContext]
});
