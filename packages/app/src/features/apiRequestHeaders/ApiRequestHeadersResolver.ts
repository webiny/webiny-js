import type { Container } from "@webiny/di";
import { ApiRequestHeaders } from "./abstractions.js";
import { mergeProviderHeaders } from "./mergeHeaders.js";
import type { ApiRequestHeadersResolver as Abstraction } from "./abstractions.js";

/**
 * Looks the providers up on every request, not once: the clients are singletons built at boot, and
 * extensions register their providers later, while the app renders (like `EventPublisher` with its
 * handlers).
 */
export class ApiRequestHeadersResolver implements Abstraction.Interface {
    constructor(private container: Container) {}

    async resolve(): Promise<ApiRequestHeaders.Headers> {
        const providers = this.container.resolveAll(ApiRequestHeaders);
        const results = await Promise.all(providers.map(provider => provider.getHeaders()));
        return mergeProviderHeaders(results);
    }
}
