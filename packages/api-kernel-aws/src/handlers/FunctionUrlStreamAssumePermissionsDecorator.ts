import { FunctionUrlStreamInputHandler } from "@webiny/kernel-aws";
import { RawAssumePermissions } from "@webiny/api-core/features/requestContext/index.js";
import { extractAssumePermissions } from "@webiny/api-core/features/requestContext/index.js";
import type { InputContext } from "@webiny/kernel-core";
import type { NextFunction } from "@webiny/kernel-core";
import { headersFromFunctionUrlEvent } from "./extractRequestAuth.js";

/**
 * EXTRACT (transport-specific): reads the `x-webiny-assume-permissions` header of a Function URL
 * event into RawAssumePermissions. Function URL mirror of ApiGatewayAssumePermissionsDecorator.
 */
class FunctionUrlStreamAssumePermissionsDecoratorImpl
    implements FunctionUrlStreamInputHandler.Interface
{
    constructor(
        private rawAssumePermissions: RawAssumePermissions.Interface,
        private decoratee: FunctionUrlStreamInputHandler.Interface
    ) {}

    async execute(ctx: InputContext<any>, next: NextFunction): Promise<void> {
        const headers = headersFromFunctionUrlEvent(ctx.input);
        const requested = extractAssumePermissions(headers);

        this.rawAssumePermissions.set(requested);

        return this.decoratee.execute(ctx, next);
    }
}

export const FunctionUrlStreamAssumePermissionsDecorator =
    FunctionUrlStreamInputHandler.createDecorator({
        decorator: FunctionUrlStreamAssumePermissionsDecoratorImpl,
        dependencies: [RawAssumePermissions]
    });
