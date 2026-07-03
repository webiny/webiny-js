import type { S3Event } from "@webiny/aws-sdk/types/index.js";
import { S3EventHandler } from "@webiny/event-handler-aws";
import {
    RawTenantId,
    RequestTenantLoader
} from "@webiny/api-core/features/requestContext/index.js";
import type { IRequestTenantLoader } from "@webiny/api-core/features/requestContext/abstractions.js";
import type { EventContext, NextFunction } from "@webiny/event-handler-core";

/**
 * EXTRACT (transport-specific): reads the tenant id from an S3 event's bucket name (convention
 * "<tenant>-…" → "<tenant>") into RawTenantId, then invokes the shared LOAD step
 * (RequestTenantLoader). Mirrors the API Gateway tenant decorator — same shared load, different
 * extract. S3 events carry no user identity, so no auth token is extracted.
 */
class S3TenantLoaderDecoratorImpl implements S3EventHandler.Interface {
    constructor(
        private rawTenantId: RawTenantId.Interface,
        private tenantLoader: IRequestTenantLoader,
        private decoratee: S3EventHandler.Interface
    ) {}

    async execute(ctx: EventContext<S3Event>, next: NextFunction): Promise<any> {
        const bucket = ctx.event?.Records?.[0]?.s3?.bucket?.name;
        this.rawTenantId.set(bucket ? (bucket.split("-")[0] ?? null) : null);
        await this.tenantLoader.establish();
        return this.decoratee.execute(ctx, next);
    }
}

export const S3TenantLoaderDecorator = S3EventHandler.createDecorator({
    decorator: S3TenantLoaderDecoratorImpl,
    dependencies: [RawTenantId, RequestTenantLoader]
});
