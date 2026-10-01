import { GraphQLClient } from "@webiny/app/features/graphqlClient/index.js";
import { PreviewContext } from "./abstractions.js";
import { PREVIEW_AS_HEADER } from "./previewAsHeader.js";
import { previewAsHeaderValue } from "./previewAsHeader.js";

/**
 * Tells the API which role to evaluate the request against while a preview is active. Mirrors the
 * tenancy `GraphQLClientDecorator`.
 */
class GraphQLClientWithPreview implements GraphQLClient.Interface {
    constructor(
        private context: PreviewContext.Interface,
        private decoratee: GraphQLClient.Interface
    ) {}

    async execute<TResult = any, TVariables = any>(
        params: GraphQLClient.Request<TVariables>
    ): Promise<TResult> {
        const headers: GraphQLClient.Headers = { ...params.headers };
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

export const GraphQLClientDecorator = GraphQLClient.createDecorator({
    decorator: GraphQLClientWithPreview,
    dependencies: [PreviewContext]
});
