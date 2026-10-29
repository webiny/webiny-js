import type { Container } from "@webiny/di";
import {
    HttpRouteDefinition,
    HttpRouteHandler,
    RequestContainer
} from "@webiny/event-handler-core";
import type { IHttpRequest, IHttpResponse } from "@webiny/event-handler-core";
import { BenchmarkAbstraction } from "@webiny/api";
import { CmsSchemaExecutor } from "~/graphql/CmsSchemaExecutor.js";
import { CmsGraphQLSchemaVariant } from "~/features/graphql/index.js";
import type { ApiEndpoint } from "~/types/index.js";

const ENDPOINTS: ApiEndpoint[] = ["manage", "read", "preview"];
const VARIANT_NAME = /^v[0-9]+$/;

/**
 * The HTTP routes for CMS GraphQL schema variants: `/cms/{variant}/{type}`, and the same path with a
 * trailing locale segment, which v5 clients still send. A request is only served when a
 * `CmsGraphQLSchemaVariant` with that name is registered; otherwise the route answers 404.
 */
class CmsSchemaVariantRoute implements HttpRouteHandler.Interface {
    // public (not private): see the note in createCmsRoute.ts.
    constructor(public container: Container) {}

    async handle(request: IHttpRequest): Promise<IHttpResponse> {
        const { variant: name, type } = request.pathParameters;

        const variant = VARIANT_NAME.test(name)
            ? this.container.resolveAll(CmsGraphQLSchemaVariant).find(item => item.name === name)
            : undefined;

        if (!variant || !ENDPOINTS.includes(type as ApiEndpoint)) {
            return {
                statusCode: 404,
                headers: { "Content-Type": "application/json" },
                body: { data: null, error: { message: "Not found.", code: "NOT_FOUND" } }
            };
        }

        const result = await this.container
            .resolve(CmsSchemaExecutor)
            .execute(type as ApiEndpoint, request.body, { variant });
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
    implementation: CmsSchemaVariantRoute,
    dependencies: [RequestContainer]
});

class CmsSchemaVariantRouteDefinition implements HttpRouteDefinition.Interface {
    readonly name = "cms-schema-variant";
    readonly method = "POST";
    readonly path = "/cms/:variant/:type";
    readonly handler = implementation;
}

class CmsSchemaVariantLocaleRouteDefinition implements HttpRouteDefinition.Interface {
    readonly name = "cms-schema-variant-locale";
    readonly method = "POST";
    readonly path = "/cms/:variant/:type/:locale";
    readonly handler = implementation;
}

export function createCmsSchemaVariantRoutes() {
    return [
        HttpRouteDefinition.createImplementation({
            implementation: CmsSchemaVariantRouteDefinition,
            dependencies: []
        }),
        HttpRouteDefinition.createImplementation({
            implementation: CmsSchemaVariantLocaleRouteDefinition,
            dependencies: []
        })
    ];
}
