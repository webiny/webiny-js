import { HttpRouter } from "@webiny/event-handler-core";
import type { IHttpRequest } from "@webiny/event-handler-core";
import type { IHttpResponse } from "@webiny/event-handler-core";
import { RawTenantId } from "@webiny/api-core/features/requestContext/index.js";
import { RequestTenantLoader } from "@webiny/api-core/features/requestContext/index.js";
import { extractTenantId } from "~/auth/extractTenantId.js";

/**
 * Reads the tenant id from the request's `x-tenant` header into RawTenantId, then runs the shared load
 * step, RequestTenantLoader, which resolves the Tenant and sets TenantContext. A missing header means
 * the root tenant.
 */
class HttpTenantLoaderDecoratorImpl implements HttpRouter.Interface {
    constructor(
        private rawTenantId: RawTenantId.Interface,
        private tenantLoader: RequestTenantLoader.Interface,
        private decoratee: HttpRouter.Interface
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
