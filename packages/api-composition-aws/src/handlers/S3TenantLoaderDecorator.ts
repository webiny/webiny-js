import type { S3Event } from "@webiny/aws-sdk/types/index.js";
import { S3InputHandler } from "@webiny/api-kernel-aws";
import {
    RawTenantId,
    RequestTenantLoader,
    TenantNotFoundError
} from "@webiny/api-core/features/requestContext/index.js";
import type { IRequestTenantLoader } from "@webiny/api-core/features/requestContext/abstractions.js";
import type { InputContext, NextFunction } from "@webiny/api-kernel-core";

/**
 * EXTRACT (transport-specific): reads the tenant id from an S3 event's bucket name (convention
 * "<tenant>-…" → "<tenant>") into RawTenantId, then invokes the shared LOAD step
 * (RequestTenantLoader). Mirrors the API Gateway tenant decorator — same shared load, different
 * extract. S3 events carry no user identity, so no auth token is extracted.
 */
class S3TenantLoaderDecoratorImpl implements S3InputHandler.Interface {
    constructor(
        private rawTenantId: RawTenantId.Interface,
        private tenantLoader: IRequestTenantLoader,
        private decoratee: S3InputHandler.Interface
    ) {}

    async execute(ctx: InputContext<S3Event>, next: NextFunction): Promise<any> {
        const bucket = ctx.input?.Records?.[0]?.s3?.bucket?.name;
        this.rawTenantId.set(bucket ? (bucket.split("-")[0] ?? null) : null);
        try {
            await this.tenantLoader.establish();
        } catch (error) {
            /* The bucket-name prefix isn't always a tenant id, so an unknown one leaves the tenant
               unset and lets the event through, as before. */
            if (!(error instanceof TenantNotFoundError)) {
                throw error;
            }
        }
        return this.decoratee.execute(ctx, next);
    }
}

export const S3TenantLoaderDecorator = S3InputHandler.createDecorator({
    decorator: S3TenantLoaderDecoratorImpl,
    dependencies: [RawTenantId, RequestTenantLoader]
});
