import { FunctionUrlStreamEventHandler } from "@webiny/event-handler-aws";
import { RawAssumePermissions } from "@webiny/api-core/features/requestContext/index.js";
import { extractAssumePermissions } from "@webiny/api-core/features/requestContext/index.js";
import type { EventContext } from "@webiny/event-handler-core";
import type { NextFunction } from "@webiny/event-handler-core";
import { headersFromFunctionUrlEvent } from "./extractRequestAuth.js";

/**
 * EXTRACT (transport-specific): reads the `x-webiny-assume-permissions` header of a Function URL event
 * into RawAssumePermissions. Function URL mirror of ApiGatewayAssumePermissionsDecorator.
 */
class FunctionUrlStreamAssumePermissionsDecoratorImpl
    implements FunctionUrlStreamEventHandler.Interface
{
    constructor(
        private rawAssumePermissions: RawAssumePermissions.Interface,
        private decoratee: FunctionUrlStreamEventHandler.Interface
    ) {}

    async execute(ctx: EventContext<any>, next: NextFunction): Promise<void> {
        const headers = headersFromFunctionUrlEvent(ctx.event);
        const requested = extractAssumePermissions(headers);

        this.rawAssumePermissions.set(requested);

        return this.decoratee.execute(ctx, next);
    }
}

export const FunctionUrlStreamAssumePermissionsDecorator =
    FunctionUrlStreamEventHandler.createDecorator({
        decorator: FunctionUrlStreamAssumePermissionsDecoratorImpl,
        dependencies: [RawAssumePermissions]
    });
