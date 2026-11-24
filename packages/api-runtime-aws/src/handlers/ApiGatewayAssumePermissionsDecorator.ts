import type { APIGatewayProxyEvent } from "@webiny/aws-sdk/types/index.js";
import { ApiGatewayInputHandler } from "@webiny/api-kernel-aws";
import { RawAssumePermissions } from "@webiny/api-core/features/requestContext/index.js";
import { extractAssumePermissions } from "@webiny/api-core/features/requestContext/index.js";
import type { InputContext } from "@webiny/api-kernel-core";
import type { NextFunction } from "@webiny/api-kernel-core";

/**
 * EXTRACT (transport-specific): reads the `x-webiny-assume-permissions` header of an API Gateway
 * event into RawAssumePermissions, so AssumedPermissions can evaluate the request against that
 * role instead of the caller's own. There is no LOAD step: the holder is read lazily, the first
 * time something asks for permissions.
 *
 * A missing header leaves RawAssumePermissions null, which is the normal case.
 */
class ApiGatewayAssumePermissionsDecoratorImpl implements ApiGatewayInputHandler.Interface {
    constructor(
        private rawAssumePermissions: RawAssumePermissions.Interface,
        private decoratee: ApiGatewayInputHandler.Interface
    ) {}

    async execute(ctx: InputContext<APIGatewayProxyEvent>, next: NextFunction): Promise<any> {
        const headers = ctx.input?.headers;
        const requested = extractAssumePermissions(headers);

        this.rawAssumePermissions.set(requested);

        return this.decoratee.execute(ctx, next);
    }
}

export const ApiGatewayAssumePermissionsDecorator = ApiGatewayInputHandler.createDecorator({
    decorator: ApiGatewayAssumePermissionsDecoratorImpl,
    dependencies: [RawAssumePermissions]
});
