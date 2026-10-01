import { ApiStreamClient } from "@webiny/app/features/apiStreamClient/index.js";
import { PreviewContext } from "./abstractions.js";
import { PREVIEW_AS_HEADER } from "./previewAsHeader.js";
import { previewAsHeaderValue } from "./previewAsHeader.js";

/**
 * Carries the previewed role onto streaming requests too, so a streaming route enforces the same
 * permissions as an equivalent GraphQL call.
 */
class ApiStreamClientWithPreview implements ApiStreamClient.Interface {
    constructor(
        private context: PreviewContext.Interface,
        private decoratee: ApiStreamClient.Interface
    ) {}

    async execute(params: ApiStreamClient.Request): Promise<ApiStreamClient.Response> {
        const headers: ApiStreamClient.Headers = { ...params.headers };
        const activePreview = this.context.get();

        /*
         * A caller that set the header itself keeps its value. The role list query sends it empty, so
         * its own lists come back as the signed-in user rather than as the role being previewed.
         */
        if (activePreview && !(PREVIEW_AS_HEADER in headers)) {
            headers[PREVIEW_AS_HEADER] = previewAsHeaderValue(activePreview);
        }

        return this.decoratee.execute({ ...params, headers });
    }
}

export const ApiStreamClientDecorator = ApiStreamClient.createDecorator({
    decorator: ApiStreamClientWithPreview,
    dependencies: [PreviewContext]
});
