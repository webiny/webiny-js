import { FunctionUrlStreamEventHandler } from "@webiny/event-handler-aws";
import {
    RawTenantId,
    RequestTenantLoader
} from "@webiny/api-core/features/requestContext/index.js";
import type { IRequestTenantLoader } from "@webiny/api-core/features/requestContext/abstractions.js";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";
import { extractTenantId, headersFromFunctionUrlEvent } from "./extractRequestAuth.js";

/**
 * EXTRACT (transport-specific): reads the tenant id from the `x-tenant` header of a Function URL event
 * into RawTenantId, then invokes the shared LOAD step (RequestTenantLoader). A missing header leaves
 * RawTenantId null → the loader defaults to the "root" tenant.
 *
 * Registered AFTER FunctionUrlStreamIdentityLoaderDecorator.
 */
class FunctionUrlStreamTenantLoaderDecoratorImpl
    implements FunctionUrlStreamEventHandler.Interface
{
    constructor(
        private rawTenantId: RawTenantId.Interface,
        private tenantLoader: IRequestTenantLoader,
        private decoratee: FunctionUrlStreamEventHandler.Interface
    ) {}

    async execute(ctx: EventContext<any>, next: NextFunction): Promise<void> {
        const headers = headersFromFunctionUrlEvent(ctx.event);
        const tenantId = extractTenantId(headers);

        this.rawTenantId.set(tenantId);

        await this.tenantLoader.establish();
        return this.decoratee.execute(ctx, next);
    }
}

export const FunctionUrlStreamTenantLoaderDecorator = FunctionUrlStreamEventHandler.createDecorator(
    {
        decorator: FunctionUrlStreamTenantLoaderDecoratorImpl,
        dependencies: [RawTenantId, RequestTenantLoader]
    }
);
