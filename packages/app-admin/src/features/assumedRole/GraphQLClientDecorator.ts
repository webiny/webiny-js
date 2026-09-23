import { GraphQLClient } from "@webiny/app/features/graphqlClient/index.js";
import { AssumedRoleContext } from "./abstractions.js";
import { ASSUME_ROLE_HEADER } from "./assumeRoleHeader.js";
import { assumeRoleHeaderValue } from "./assumeRoleHeader.js";

/**
 * Tells the API which role to evaluate the request against while a preview is active. Mirrors the
 * tenancy `GraphQLClientDecorator`.
 */
class GraphQLClientWithAssumedRole implements GraphQLClient.Interface {
    constructor(
        private context: AssumedRoleContext.Interface,
        private decoratee: GraphQLClient.Interface
    ) {}

    async execute<TResult = any, TVariables = any>(
        params: GraphQLClient.Request<TVariables>
    ): Promise<TResult> {
        const headers: GraphQLClient.Headers = { ...params.headers };
        const assumedRole = this.context.get();

        /*
         * A caller that set the header itself keeps its value. The role picker sends it empty, so
         * its own lists come back as the signed-in user rather than as the role being previewed.
         */
        if (assumedRole && !(ASSUME_ROLE_HEADER in headers)) {
            headers[ASSUME_ROLE_HEADER] = assumeRoleHeaderValue(assumedRole);
        }

        return this.decoratee.execute({ ...params, headers });
    }
}

export const GraphQLClientDecorator = GraphQLClient.createDecorator({
    decorator: GraphQLClientWithAssumedRole,
    dependencies: [AssumedRoleContext]
});
