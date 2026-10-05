import { ApiStreamClient } from "@webiny/app/features/apiStreamClient/index.js";
import { AssumePermissionsContext } from "./abstractions.js";
import { ASSUME_PERMISSIONS_HEADER } from "./assumePermissionsHeader.js";
import { assumePermissionsHeaderValue } from "./assumePermissionsHeader.js";

/**
 * Carries the previewed role onto streaming requests too, so a streaming route enforces the same
 * permissions as an equivalent GraphQL call.
 */
class ApiStreamClientWithAssumedPermissions implements ApiStreamClient.Interface {
    constructor(
        private context: AssumePermissionsContext.Interface,
        private decoratee: ApiStreamClient.Interface
    ) {}

    async execute(params: ApiStreamClient.Request): Promise<ApiStreamClient.Response> {
        const headers: ApiStreamClient.Headers = { ...params.headers };
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

export const ApiStreamClientDecorator = ApiStreamClient.createDecorator({
    decorator: ApiStreamClientWithAssumedPermissions,
    dependencies: [AssumePermissionsContext]
});
