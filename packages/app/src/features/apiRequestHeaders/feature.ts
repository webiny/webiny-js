import { createFeature } from "@webiny/feature/admin";
import type { Container } from "@webiny/di";
import { ApiRequestHeadersResolver as ResolverAbstraction } from "./abstractions.js";
import { ApiRequestHeadersResolver } from "./ApiRequestHeadersResolver.js";
import { ApiStreamClientDecorator } from "./ApiStreamClientDecorator.js";
import { GraphQLClientDecorator } from "./GraphQLClientDecorator.js";

/**
 * Adds every `ApiRequestHeaders` provider's headers to requests to Webiny's API. Register it after
 * the clients and before the decorators that add the tenant and auth headers, so those wrap it and
 * win over a provider's header of the same name.
 */
export const ApiRequestHeadersFeature = createFeature({
    name: "ApiRequestHeaders",
    register(container: Container) {
        container.registerInstance(ResolverAbstraction, new ApiRequestHeadersResolver(container));
        container.registerDecorator(GraphQLClientDecorator);
        container.registerDecorator(ApiStreamClientDecorator);
    }
});
