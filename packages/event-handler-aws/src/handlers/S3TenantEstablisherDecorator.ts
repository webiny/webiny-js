import type { S3Event } from "@webiny/aws-sdk/types/index.js";
import { S3EventHandler } from "~/abstractions/handlers/S3EventHandler.js";
import { RequestTenantEstablisher } from "@webiny/api-core/features/requestContext/index.js";
import type { IRequestTenantEstablisher } from "@webiny/api-core/features/requestContext/abstractions.js";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";

/**
 * Thin transport adapter: establishes the request tenant from an S3 event using the shared,
 * transport-agnostic RequestTenantEstablisher (which consumes the registered TenantIdExtractor
 * implementations — e.g. the S3 bucket-name extractor), then delegates to the inner handler.
 *
 * Mirrors ApiGatewayTenantEstablisherDecorator: one establishment rule (api-core), driven per
 * transport by a thin decorator over that transport's event-handler chain.
 */
class S3TenantEstablisherDecoratorImpl implements S3EventHandler.Interface {
    constructor(
        private tenantEstablisher: IRequestTenantEstablisher,
        private decoratee: S3EventHandler.Interface
    ) {}

    async execute(ctx: EventContext<S3Event>, next: NextFunction): Promise<any> {
        await this.tenantEstablisher.establish(ctx.event);
        return this.decoratee.execute(ctx, next);
    }
}

export const S3TenantEstablisherDecorator = S3EventHandler.createDecorator({
    decorator: S3TenantEstablisherDecoratorImpl,
    dependencies: [RequestTenantEstablisher]
});
