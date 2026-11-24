import type { IncomingMessage } from "node:http";
import { NodeHttpInputHandler } from "@webiny/api-kernel-core/nodeHttp/index.js";
import {
    RawTenantId,
    RequestTenantLoader
} from "@webiny/api-core/features/requestContext/index.js";
import type { IRequestTenantLoader } from "@webiny/api-core/features/requestContext/abstractions.js";
import type { InputContext, NextFunction } from "@webiny/api-kernel-core";
import { extractTenantId } from "~/auth/extractTenantId.js";
import { headersFromIncomingMessage } from "./headersFromIncomingMessage.js";

/**
 * EXTRACT (transport-specific): reads the tenant id from the `x-tenant` header of a Node
 * `IncomingMessage` into RawTenantId, then invokes the shared LOAD step (RequestTenantLoader) which
 * resolves the Tenant and sets TenantContext. A missing header leaves RawTenantId null → the loader
 * defaults to the "root" tenant.
 *
 * Node mirror of ApiGatewayTenantLoaderDecorator. Registered AFTER the identity loader.
 */
class NodeHttpTenantLoaderDecoratorImpl implements NodeHttpInputHandler.Interface {
    constructor(
        private rawTenantId: RawTenantId.Interface,
        private tenantLoader: IRequestTenantLoader,
        private decoratee: NodeHttpInputHandler.Interface
    ) {}

    async execute(ctx: InputContext<IncomingMessage>, next: NextFunction): Promise<any> {
        const headers = headersFromIncomingMessage(ctx.input);
        const tenantId = extractTenantId(headers);
        this.rawTenantId.set(tenantId);
        await this.tenantLoader.establish();
        return this.decoratee.execute(ctx, next);
    }
}

export const NodeHttpTenantLoaderDecorator = NodeHttpInputHandler.createDecorator({
    decorator: NodeHttpTenantLoaderDecoratorImpl,
    dependencies: [RawTenantId, RequestTenantLoader]
});
