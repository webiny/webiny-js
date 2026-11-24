import type { IncomingMessage } from "node:http";
import { NodeHttpInputHandler } from "@webiny/api-kernel-core/nodeHttp/index.js";
import { RawAssumePermissions } from "@webiny/api-core/features/requestContext/index.js";
import { extractAssumePermissions } from "@webiny/api-core/features/requestContext/index.js";
import type { InputContext } from "@webiny/api-kernel-core";
import type { NextFunction } from "@webiny/api-kernel-core";

/**
 * EXTRACT (transport-specific): reads the `x-webiny-assume-permissions` header of a Node
 * `IncomingMessage` into RawAssumePermissions. Node mirror of ApiGatewayAssumePermissionsDecorator.
 */
class NodeHttpAssumePermissionsDecoratorImpl implements NodeHttpInputHandler.Interface {
    constructor(
        private rawAssumePermissions: RawAssumePermissions.Interface,
        private decoratee: NodeHttpInputHandler.Interface
    ) {}

    async execute(ctx: InputContext<IncomingMessage>, next: NextFunction): Promise<any> {
        const headers = ctx.input?.headers;
        const requested = extractAssumePermissions(headers);

        this.rawAssumePermissions.set(requested);

        return this.decoratee.execute(ctx, next);
    }
}

export const NodeHttpAssumePermissionsDecorator = NodeHttpInputHandler.createDecorator({
    decorator: NodeHttpAssumePermissionsDecoratorImpl,
    dependencies: [RawAssumePermissions]
});
