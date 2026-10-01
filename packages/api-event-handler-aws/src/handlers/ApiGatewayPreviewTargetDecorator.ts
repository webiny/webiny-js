import type { APIGatewayProxyEvent } from "@webiny/aws-sdk/types/index.js";
import { ApiGatewayEventHandler } from "@webiny/event-handler-aws";
import { RawPreviewTarget } from "@webiny/api-core/features/requestContext/index.js";
import { extractPreviewTarget } from "@webiny/api-core/features/requestContext/index.js";
import type { EventContext } from "@webiny/event-handler-core";
import type { NextFunction } from "@webiny/event-handler-core";

/**
 * EXTRACT (transport-specific): reads the `x-webiny-preview-as` header of an API Gateway event
 * into RawPreviewTarget, so PreviewPermissions can evaluate the request against that role
 * instead of the caller's own. There is no LOAD step: the holder is read lazily, the first time
 * something asks for permissions.
 *
 * A missing header leaves RawPreviewTarget null, which is the normal case.
 */
class ApiGatewayPreviewTargetDecoratorImpl implements ApiGatewayEventHandler.Interface {
    constructor(
        private rawPreviewTarget: RawPreviewTarget.Interface,
        private decoratee: ApiGatewayEventHandler.Interface
    ) {}

    async execute(ctx: EventContext<APIGatewayProxyEvent>, next: NextFunction): Promise<any> {
        const headers = ctx.event?.headers;
        const previewTarget = extractPreviewTarget(headers);

        this.rawPreviewTarget.set(previewTarget);

        return this.decoratee.execute(ctx, next);
    }
}

export const ApiGatewayPreviewTargetDecorator = ApiGatewayEventHandler.createDecorator({
    decorator: ApiGatewayPreviewTargetDecoratorImpl,
    dependencies: [RawPreviewTarget]
});
