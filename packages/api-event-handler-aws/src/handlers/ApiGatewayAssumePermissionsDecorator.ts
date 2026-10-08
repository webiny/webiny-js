import type { APIGatewayProxyEvent } from "@webiny/aws-sdk/types/index.js";
import { ApiGatewayEventHandler } from "@webiny/event-handler-aws";
import { RawAssumePermissions } from "@webiny/api-core/features/requestContext/index.js";
import { extractAssumePermissions } from "@webiny/api-core/features/requestContext/index.js";
import type { EventContext } from "@webiny/event-handler-core";
import type { NextFunction } from "@webiny/event-handler-core";

/**
 * EXTRACT (transport-specific): reads the `x-webiny-assume-permissions` header of an API Gateway
 * event into RawAssumePermissions, so AssumedPermissions can evaluate the request against that
 * role instead of the caller's own. There is no LOAD step: the holder is read lazily, the first
 * time something asks for permissions.
 *
 * A missing header leaves RawAssumePermissions null, which is the normal case.
 */
class ApiGatewayAssumePermissionsDecoratorImpl implements ApiGatewayEventHandler.Interface {
    constructor(
        private rawAssumePermissions: RawAssumePermissions.Interface,
        private decoratee: ApiGatewayEventHandler.Interface
    ) {}

    async execute(ctx: EventContext<APIGatewayProxyEvent>, next: NextFunction): Promise<any> {
        const headers = ctx.event?.headers;
        const requested = extractAssumePermissions(headers);

        this.rawAssumePermissions.set(requested);

        return this.decoratee.execute(ctx, next);
    }
}

export const ApiGatewayAssumePermissionsDecorator = ApiGatewayEventHandler.createDecorator({
    decorator: ApiGatewayAssumePermissionsDecoratorImpl,
    dependencies: [RawAssumePermissions]
});
