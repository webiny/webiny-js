import { ApiStreamClient } from "@webiny/app/features/apiStreamClient/index.js";
import { AssumedRoleContext } from "./abstractions.js";
import { ASSUME_ROLE_HEADER } from "./assumeRoleHeader.js";
import { assumeRoleHeaderValue } from "./assumeRoleHeader.js";

/**
 * Carries the previewed role onto streaming requests too, so a streaming route enforces the same
 * permissions as an equivalent GraphQL call.
 */
class ApiStreamClientWithAssumedRole implements ApiStreamClient.Interface {
    constructor(
        private context: AssumedRoleContext.Interface,
        private decoratee: ApiStreamClient.Interface
    ) {}

    async execute(params: ApiStreamClient.Request): Promise<ApiStreamClient.Response> {
        const headers: ApiStreamClient.Headers = { ...params.headers };
        const assumedRole = this.context.get();

        if (assumedRole) {
            headers[ASSUME_ROLE_HEADER] = assumeRoleHeaderValue(assumedRole);
        }

        return this.decoratee.execute({ ...params, headers });
    }
}

export const ApiStreamClientDecorator = ApiStreamClient.createDecorator({
    decorator: ApiStreamClientWithAssumedRole,
    dependencies: [AssumedRoleContext]
});
