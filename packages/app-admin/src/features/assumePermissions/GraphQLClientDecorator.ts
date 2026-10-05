import { GraphQLClient } from "@webiny/app/features/graphqlClient/index.js";
import { AssumePermissionsContext } from "./abstractions.js";
import { ASSUME_PERMISSIONS_HEADER } from "./assumePermissionsHeader.js";
import { assumePermissionsHeaderValue } from "./assumePermissionsHeader.js";

/**
 * Tells the API which role to evaluate the request against while a preview is active. Mirrors the
 * tenancy `GraphQLClientDecorator`.
 */
class GraphQLClientWithAssumedPermissions implements GraphQLClient.Interface {
    constructor(
        private context: AssumePermissionsContext.Interface,
        private decoratee: GraphQLClient.Interface
    ) {}

    async execute<TResult = any, TVariables = any>(
        params: GraphQLClient.Request<TVariables>
    ): Promise<TResult> {
        const headers: GraphQLClient.Headers = { ...params.headers };
        const assumed = this.context.get();

        /*
         * A caller that set the header itself keeps its value. The role list query sends it empty,
         * so its own lists come back as the signed-in user rather than as the role being previewed.
         */
        if (assumed && !(ASSUME_PERMISSIONS_HEADER in headers)) {
            headers[ASSUME_PERMISSIONS_HEADER] = assumePermissionsHeaderValue(assumed);
        }

        return this.decoratee.execute({ ...params, headers });
    }
}

export const GraphQLClientDecorator = GraphQLClient.createDecorator({
    decorator: GraphQLClientWithAssumedPermissions,
    dependencies: [AssumePermissionsContext]
});
