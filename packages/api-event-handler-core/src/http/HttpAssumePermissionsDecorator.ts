import { HttpRouter } from "@webiny/event-handler-core";
import type { IHttpRequest, IHttpResponse, IHttpRouter } from "@webiny/event-handler-core";
import { RawAssumePermissions } from "@webiny/api-core/features/requestContext/index.js";
import { extractAssumePermissions } from "@webiny/api-core/features/requestContext/index.js";

/**
 * Reads the `x-webiny-assume-permissions` header, the role or team the Admin is previewing, into
 * RawAssumePermissions. Nothing is checked here: AssumedPermissions checks the caller's real
 * permissions before it honours the header.
 */
class HttpAssumePermissionsDecoratorImpl implements IHttpRouter {
    constructor(
        private rawAssumePermissions: RawAssumePermissions.Interface,
        private decoratee: IHttpRouter
    ) {}

    async route(request: IHttpRequest): Promise<IHttpResponse> {
        const requested = extractAssumePermissions(request.headers);
        this.rawAssumePermissions.set(requested);
        return this.decoratee.route(request);
    }
}

export const HttpAssumePermissionsDecorator = HttpRouter.createDecorator({
    decorator: HttpAssumePermissionsDecoratorImpl,
    dependencies: [RawAssumePermissions]
});
