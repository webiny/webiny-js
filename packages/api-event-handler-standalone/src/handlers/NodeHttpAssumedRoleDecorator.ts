import type { IncomingMessage } from "node:http";
import { NodeHttpEventHandler } from "@webiny/event-handler-standalone";
import { RawAssumedRole } from "@webiny/api-core/features/requestContext/index.js";
import { extractAssumedRole } from "@webiny/api-core/features/requestContext/index.js";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";

/**
 * EXTRACT (transport-specific): reads the `x-webiny-assume-role` header of a Node
 * `IncomingMessage` into RawAssumedRole. Node mirror of ApiGatewayAssumedRoleDecorator.
 */
class NodeHttpAssumedRoleDecoratorImpl implements NodeHttpEventHandler.Interface {
    constructor(
        private rawAssumedRole: RawAssumedRole.Interface,
        private decoratee: NodeHttpEventHandler.Interface
    ) {}

    async execute(ctx: EventContext<IncomingMessage>, next: NextFunction): Promise<any> {
        const headers = ctx.event?.headers;
        const assumedRole = extractAssumedRole(headers);

        this.rawAssumedRole.set(assumedRole);

        return this.decoratee.execute(ctx, next);
    }
}

export const NodeHttpAssumedRoleDecorator = NodeHttpEventHandler.createDecorator({
    decorator: NodeHttpAssumedRoleDecoratorImpl,
    dependencies: [RawAssumedRole]
});
