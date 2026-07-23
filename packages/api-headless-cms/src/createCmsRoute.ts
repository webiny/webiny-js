import type { Container } from "@webiny/di";
import { HttpRoute, RequestContainer } from "@webiny/event-handler-core";
import type { IHttpRequest, IHttpResponse } from "@webiny/event-handler-core";
import { GraphQLContextualSchema } from "@webiny/api-graphql";
import type { IGraphQLContextualSchema } from "@webiny/api-graphql";
import { BenchmarkAbstraction } from "@webiny/api";
import { CmsSchemaExecutor } from "~/graphql/CmsSchemaExecutor.js";
import type { ApiEndpoint } from "~/types/index.js";

const CMS_PATHS: Record<ApiEndpoint, string> = {
    manage: "/cms/manage",
    read: "/cms/read",
    preview: "/cms/preview"
};

/**
 * The HTTP route for a CMS GraphQL endpoint (manage/read/preview). Per request it runs the
 * contextual schemas, then executes the CMS sub-schema via CmsSchemaExecutor. The post-auth
 * RequestContextInitializers are run once per request by the HTTP layer
 * (RequestContextInitializerDecorator) before the router dispatches, so they cover every route.
 */
export function createCmsRoute(type: ApiEndpoint) {
    class CmsGraphQLRoute implements HttpRoute.Interface {
        readonly method = "POST";
        readonly path = CMS_PATHS[type];

        // public (not private): this class is returned from an exported factory, so its members
        // must be declarable in the emitted .d.ts — private parameter-properties on an exported
        // anonymous class type are a TS4094 error.
        constructor(
            public container: Container,
            public contextualSchemas: IGraphQLContextualSchema[]
        ) {}

        async handle(request: IHttpRequest): Promise<IHttpResponse> {
            const ctx: Record<string, any> = { container: this.container };
            for (const schema of this.contextualSchemas) {
                await schema.build(ctx);
            }
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

    return HttpRoute.createImplementation({
        implementation: CmsGraphQLRoute,
        dependencies: [RequestContainer, [GraphQLContextualSchema, { multiple: true }]]
    });
}
