import { FunctionUrlStreamInputHandler } from "@webiny/kernel-aws";
import {
    RawTenantId,
    RequestTenantLoader
} from "@webiny/api-core/features/requestContext/index.js";
import type { IRequestTenantLoader } from "@webiny/api-core/features/requestContext/abstractions.js";
import type { InputContext, NextFunction } from "@webiny/kernel-core";
import { extractTenantId } from "@webiny/api-kernel-core";
import { headersFromFunctionUrlEvent } from "./extractRequestAuth.js";

/**
 * EXTRACT (transport-specific): reads the tenant id from the `x-tenant` header of a Function URL event
 * into RawTenantId, then invokes the shared LOAD step (RequestTenantLoader). A missing header leaves
 * RawTenantId null → the loader defaults to the "root" tenant.
 *
 * Registered AFTER FunctionUrlStreamIdentityLoaderDecorator.
 */
class FunctionUrlStreamTenantLoaderDecoratorImpl
    implements FunctionUrlStreamInputHandler.Interface
{
    constructor(
        private rawTenantId: RawTenantId.Interface,
        private tenantLoader: IRequestTenantLoader,
        private decoratee: FunctionUrlStreamInputHandler.Interface
    ) {}

    async execute(ctx: InputContext<any>, next: NextFunction): Promise<void> {
        const headers = headersFromFunctionUrlEvent(ctx.input);
        const tenantId = extractTenantId(headers);

        this.rawTenantId.set(tenantId);

        await this.tenantLoader.establish();
        return this.decoratee.execute(ctx, next);
    }
}

export const FunctionUrlStreamTenantLoaderDecorator = FunctionUrlStreamInputHandler.createDecorator(
    {
        decorator: FunctionUrlStreamTenantLoaderDecoratorImpl,
        dependencies: [RawTenantId, RequestTenantLoader]
    }
);
