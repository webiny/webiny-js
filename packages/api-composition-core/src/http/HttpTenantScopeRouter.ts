import { HttpRouteDispatcher, HttpRouter, HttpStreamBody } from "@webiny/api-kernel-core";
import type { IHttpRequest } from "@webiny/api-kernel-core";
import type { IHttpResponse } from "@webiny/api-kernel-core";
import { RawTenantId } from "@webiny/api-core/features/requestContext/index.js";
import { RequestTenantLoader } from "@webiny/api-core/features/requestContext/index.js";
import {
    TenantScopes,
    TenantScopeUsage
} from "@webiny/api-core/features/tenancy/TenantScopes/index.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import { extractTenantId } from "~/auth/extractTenantId.js";
import { readStreamInScope } from "./readStreamInScope.js";

/**
 * The tenant step of an HTTP request, and its hand-off into the tenant's scope. Registered as
 * `HttpRouter`'s implementation, so it runs at request level, inside `HttpRouter`'s decorators
 * (errors, CORS, compression, assume-permissions). A CORS preflight is answered before it runs.
 *
 * It reads the tenant id from the `x-tenant` header (none means the root tenant), loads the tenant
 * from the request's tenant registry, and runs the request's route in that tenant's scope:
 * `HttpRouteDispatcher`, with its decorators (the identity loader), is resolved from the scope. An
 * unknown tenant (`TenantNotFoundError`) or a disabled one fails here, before any scope is built, and
 * `ErrorResponseDecorator` answers it with CORS headers.
 *
 * A streamed body is read in the scope too, and the scope stays in use until it is read. When the
 * request's work in its scope ends, it logs what the request's tenant scopes held.
 */
class HttpTenantScopeRouterImpl implements HttpRouter.Interface {
    constructor(
        private readonly rawTenantId: RawTenantId.Interface,
        private readonly tenantLoader: RequestTenantLoader.Interface,
        private readonly tenantScopes: TenantScopes.Interface,
        private readonly usage: TenantScopeUsage.Interface | undefined
    ) {}

    async route(request: IHttpRequest): Promise<IHttpResponse> {
        this.rawTenantId.set(extractTenantId(request));
        const tenant = await this.tenantLoader.establish();

        let streamed: (response: IHttpResponse) => void = () => {};
        const streamResponse = new Promise<IHttpResponse>(resolve => {
            streamed = resolve;
        });

        const inScope = this.routeInScope(tenant, request, streamed).finally(() => {
            this.usage?.report();
        });

        // A buffered response once the scope's callback ends, a streamed one as soon as it starts.
        return Promise.race([inScope, streamResponse]);
    }

    private routeInScope(
        tenant: Tenant,
        request: IHttpRequest,
        streamed: (response: IHttpResponse) => void
    ): Promise<IHttpResponse> {
        return this.tenantScopes.withTenant(tenant, async scope => {
            const response = await scope.resolve(HttpRouteDispatcher).route(request);
            if (!HttpStreamBody.is(response.body)) {
                return response;
            }

            // The callback, and with it the scope's use, lasts until the transport has read the body.
            return new Promise<IHttpResponse>(resolve => {
                const body = readStreamInScope(response.body, () => resolve(response));
                streamed({ ...response, body });
            });
        });
    }
}

export const HttpTenantScopeRouter = HttpRouter.createImplementation({
    implementation: HttpTenantScopeRouterImpl,
    dependencies: [
        RawTenantId,
        RequestTenantLoader,
        TenantScopes,
        [TenantScopeUsage, { optional: true }]
    ]
});
