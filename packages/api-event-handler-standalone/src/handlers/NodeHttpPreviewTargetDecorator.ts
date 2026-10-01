import type { IncomingMessage } from "node:http";
import { NodeHttpEventHandler } from "@webiny/event-handler-standalone";
import { RawPreviewTarget } from "@webiny/api-core/features/requestContext/index.js";
import { extractPreviewTarget } from "@webiny/api-core/features/requestContext/index.js";
import type { EventContext } from "@webiny/event-handler-core";
import type { NextFunction } from "@webiny/event-handler-core";

/**
 * EXTRACT (transport-specific): reads the `x-webiny-preview-as` header of a Node
 * `IncomingMessage` into RawPreviewTarget. Node mirror of ApiGatewayPreviewTargetDecorator.
 */
class NodeHttpPreviewTargetDecoratorImpl implements NodeHttpEventHandler.Interface {
    constructor(
        private rawPreviewTarget: RawPreviewTarget.Interface,
        private decoratee: NodeHttpEventHandler.Interface
    ) {}

    async execute(ctx: EventContext<IncomingMessage>, next: NextFunction): Promise<any> {
        const headers = ctx.event?.headers;
        const previewTarget = extractPreviewTarget(headers);

        this.rawPreviewTarget.set(previewTarget);

        return this.decoratee.execute(ctx, next);
    }
}

export const NodeHttpPreviewTargetDecorator = NodeHttpEventHandler.createDecorator({
    decorator: NodeHttpPreviewTargetDecoratorImpl,
    dependencies: [RawPreviewTarget]
});
