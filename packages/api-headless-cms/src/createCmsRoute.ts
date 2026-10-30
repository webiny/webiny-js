import type { Container } from "@webiny/di";
import {
    HttpRouteDefinition,
    HttpRouteHandler,
    RequestContainer
} from "@webiny/event-handler-core";
import type { IHttpRequest, IHttpResponse } from "@webiny/event-handler-core";
import { BenchmarkAbstraction } from "@webiny/api";
import { CmsSchemaExecutor } from "~/graphql/CmsSchemaExecutor.js";
import type { ApiEndpoint } from "~/types/index.js";

const CMS_PATHS: Record<ApiEndpoint, string> = {
    manage: "/cms/manage",
    read: "/cms/read",
    preview: "/cms/preview"
};

/**
 * The HTTP route for a CMS GraphQL endpoint (manage/read/preview). It executes the CMS sub-schema
 * via CmsSchemaExecutor.
 */
export function createCmsRoute(type: ApiEndpoint) {
    class CmsGraphQLRoute implements HttpRouteHandler.Interface {
        // public (not private): this class is returned from an exported factory, so its members
        // must be declarable in the emitted .d.ts — private parameter-properties on an exported
        // anonymous class type are a TS4094 error.
        constructor(public container: Container) {}

        async handle(request: IHttpRequest): Promise<IHttpResponse> {
            const result = await this.container
                .resolve(CmsSchemaExecutor)
                .execute(type, request.body);
            // Flush benchmark measurements (no-op unless benchmarking was enabled for the request).
            await this.container.resolve(BenchmarkAbstraction).output();
            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json" },
                body: result
            };
        }
    }

    const implementation = HttpRouteHandler.createImplementation({
        implementation: CmsGraphQLRoute,
        dependencies: [RequestContainer]
    });

    class CmsRouteDefinition implements HttpRouteDefinition.Interface {
        readonly name = `cms-${type}`;
        readonly method = "POST";
        readonly path = CMS_PATHS[type];
        readonly handler = implementation;
    }

    return HttpRouteDefinition.createImplementation({
        implementation: CmsRouteDefinition,
        dependencies: []
    });
}
