import { FunctionUrlStreamEventHandler } from "@webiny/event-handler-aws";
import { RawAssumedRole } from "@webiny/api-core/features/requestContext/index.js";
import { extractAssumedRole } from "@webiny/api-core/features/requestContext/index.js";
import type { EventContext } from "@webiny/event-handler-core";
import type { NextFunction } from "@webiny/event-handler-core";
import { headersFromFunctionUrlEvent } from "./extractRequestAuth.js";

/**
 * EXTRACT (transport-specific): reads the `x-webiny-assume-role` header of a Function URL event
 * into RawAssumedRole. Function URL mirror of ApiGatewayAssumedRoleDecorator.
 */
class FunctionUrlStreamAssumedRoleDecoratorImpl implements FunctionUrlStreamEventHandler.Interface {
    constructor(
        private rawAssumedRole: RawAssumedRole.Interface,
        private decoratee: FunctionUrlStreamEventHandler.Interface
    ) {}

    async execute(ctx: EventContext<any>, next: NextFunction): Promise<void> {
        const headers = headersFromFunctionUrlEvent(ctx.event);
        const assumedRole = extractAssumedRole(headers);

        this.rawAssumedRole.set(assumedRole);

        return this.decoratee.execute(ctx, next);
    }
}

export const FunctionUrlStreamAssumedRoleDecorator = FunctionUrlStreamEventHandler.createDecorator({
    decorator: FunctionUrlStreamAssumedRoleDecoratorImpl,
    dependencies: [RawAssumedRole]
});
