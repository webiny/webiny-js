import { HttpRouter } from "@webiny/event-handler-core";
import type { IHttpRequest, IHttpResponse, IHttpRouter } from "@webiny/event-handler-core";
import {
    RawTenantId,
    RequestTenantLoader
} from "@webiny/api-core/features/requestContext/index.js";
import type { IRequestTenantLoader } from "@webiny/api-core/features/requestContext/abstractions.js";
import { extractTenantId } from "~/auth/extractTenantId.js";

/**
 * Reads the tenant id from the request's `x-tenant` header into RawTenantId, then runs the shared load
 * step, RequestTenantLoader, which resolves the Tenant and sets TenantContext. A missing header means
 * the root tenant.
 */
class HttpTenantLoaderDecoratorImpl implements IHttpRouter {
    constructor(
        private rawTenantId: RawTenantId.Interface,
        private tenantLoader: IRequestTenantLoader,
        private decoratee: IHttpRouter
    ) {}

    async route(request: IHttpRequest): Promise<IHttpResponse> {
        const tenantId = extractTenantId(request.headers);
        this.rawTenantId.set(tenantId);
        await this.tenantLoader.establish();
        return this.decoratee.route(request);
    }
}

export const HttpTenantLoaderDecorator = HttpRouter.createDecorator({
    decorator: HttpTenantLoaderDecoratorImpl,
    dependencies: [RawTenantId, RequestTenantLoader]
});
