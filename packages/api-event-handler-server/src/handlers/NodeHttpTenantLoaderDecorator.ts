import type { IncomingMessage } from "node:http";
import { NodeHttpEventHandler } from "@webiny/event-handler-server";
import {
    RawTenantId,
    RequestTenantLoader
} from "@webiny/api-core/features/requestContext/index.js";
import type { IRequestTenantLoader } from "@webiny/api-core/features/requestContext/abstractions.js";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";

function headerValue(value: string | string[] | undefined): string | null {
    if (Array.isArray(value)) {
        return value[0] ?? null;
    }
    return value ?? null;
}

/**
 * EXTRACT (transport-specific): reads the tenant id from the `x-tenant` header of a Node
 * `IncomingMessage` into RawTenantId, then invokes the shared LOAD step (RequestTenantLoader) which
 * resolves the Tenant and sets TenantContext. A missing header leaves RawTenantId null → the loader
 * defaults to the "root" tenant.
 *
 * Node mirror of ApiGatewayTenantLoaderDecorator. Registered AFTER the identity loader.
 */
class NodeHttpTenantLoaderDecoratorImpl implements NodeHttpEventHandler.Interface {
    constructor(
        private rawTenantId: RawTenantId.Interface,
        private tenantLoader: IRequestTenantLoader,
        private decoratee: NodeHttpEventHandler.Interface
    ) {}

    async execute(ctx: EventContext<IncomingMessage>, next: NextFunction): Promise<any> {
        const headers = ctx.event?.headers;
        this.rawTenantId.set(
            headers ? headerValue(headers["x-tenant"] ?? headers["X-Tenant"]) : null
        );
        await this.tenantLoader.establish();
        return this.decoratee.execute(ctx, next);
    }
}

export const NodeHttpTenantLoaderDecorator = NodeHttpEventHandler.createDecorator({
    decorator: NodeHttpTenantLoaderDecoratorImpl,
    dependencies: [RawTenantId, RequestTenantLoader]
});
