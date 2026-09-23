import type { APIGatewayProxyEvent } from "@webiny/aws-sdk/types/index.js";
import { ApiGatewayEventHandler } from "@webiny/event-handler-aws";
import { RawAssumedRole } from "@webiny/api-core/features/requestContext/index.js";
import { extractAssumedRole } from "@webiny/api-core/features/requestContext/index.js";
import type { EventContext } from "@webiny/event-handler-core";
import type { NextFunction } from "@webiny/event-handler-core";

/**
 * EXTRACT (transport-specific): reads the `x-webiny-assume-role` header of an API Gateway event
 * into RawAssumedRole, so AssumedRolePermissions can evaluate the request against that role
 * instead of the caller's own. There is no LOAD step: the holder is read lazily, the first time
 * something asks for permissions.
 *
 * A missing header leaves RawAssumedRole null, which is the normal case.
 */
class ApiGatewayAssumedRoleDecoratorImpl implements ApiGatewayEventHandler.Interface {
    constructor(
        private rawAssumedRole: RawAssumedRole.Interface,
        private decoratee: ApiGatewayEventHandler.Interface
    ) {}

    async execute(ctx: EventContext<APIGatewayProxyEvent>, next: NextFunction): Promise<any> {
        const headers = ctx.event?.headers;
        const assumedRole = extractAssumedRole(headers);

        this.rawAssumedRole.set(assumedRole);

        return this.decoratee.execute(ctx, next);
    }
}

export const ApiGatewayAssumedRoleDecorator = ApiGatewayEventHandler.createDecorator({
    decorator: ApiGatewayAssumedRoleDecoratorImpl,
    dependencies: [RawAssumedRole]
});
