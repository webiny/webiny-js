import { FunctionUrlStreamEventHandler } from "@webiny/event-handler-aws";
import { RawPreviewTarget } from "@webiny/api-core/features/requestContext/index.js";
import { extractPreviewTarget } from "@webiny/api-core/features/requestContext/index.js";
import type { EventContext } from "@webiny/event-handler-core";
import type { NextFunction } from "@webiny/event-handler-core";
import { headersFromFunctionUrlEvent } from "./extractRequestAuth.js";

/**
 * EXTRACT (transport-specific): reads the `x-webiny-preview-as` header of a Function URL event
 * into RawPreviewTarget. Function URL mirror of ApiGatewayPreviewTargetDecorator.
 */
class FunctionUrlStreamPreviewTargetDecoratorImpl
    implements FunctionUrlStreamEventHandler.Interface
{
    constructor(
        private rawPreviewTarget: RawPreviewTarget.Interface,
        private decoratee: FunctionUrlStreamEventHandler.Interface
    ) {}

    async execute(ctx: EventContext<any>, next: NextFunction): Promise<void> {
        const headers = headersFromFunctionUrlEvent(ctx.event);
        const previewTarget = extractPreviewTarget(headers);

        this.rawPreviewTarget.set(previewTarget);

        return this.decoratee.execute(ctx, next);
    }
}

export const FunctionUrlStreamPreviewTargetDecorator =
    FunctionUrlStreamEventHandler.createDecorator({
        decorator: FunctionUrlStreamPreviewTargetDecoratorImpl,
        dependencies: [RawPreviewTarget]
    });
