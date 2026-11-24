import type { IncomingMessage } from "node:http";
import { NodeHttpEventHandler } from "@webiny/kernel-core/nodeHttp/index.js";
import { RawAssumePermissions } from "@webiny/api-core/features/requestContext/index.js";
import { extractAssumePermissions } from "@webiny/api-core/features/requestContext/index.js";
import type { EventContext } from "@webiny/kernel-core";
import type { NextFunction } from "@webiny/kernel-core";

/**
 * EXTRACT (transport-specific): reads the `x-webiny-assume-permissions` header of a Node
 * `IncomingMessage` into RawAssumePermissions. Node mirror of ApiGatewayAssumePermissionsDecorator.
 */
class NodeHttpAssumePermissionsDecoratorImpl implements NodeHttpEventHandler.Interface {
    constructor(
        private rawAssumePermissions: RawAssumePermissions.Interface,
        private decoratee: NodeHttpEventHandler.Interface
    ) {}

    async execute(ctx: EventContext<IncomingMessage>, next: NextFunction): Promise<any> {
        const headers = ctx.event?.headers;
        const requested = extractAssumePermissions(headers);

        this.rawAssumePermissions.set(requested);

        return this.decoratee.execute(ctx, next);
    }
}

export const NodeHttpAssumePermissionsDecorator = NodeHttpEventHandler.createDecorator({
    decorator: NodeHttpAssumePermissionsDecoratorImpl,
    dependencies: [RawAssumePermissions]
});
