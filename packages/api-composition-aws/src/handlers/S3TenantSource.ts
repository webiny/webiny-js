import { S3InputHandler } from "@webiny/api-kernel-aws";
import type { InputChainRunner } from "@webiny/api-kernel-core";
import { InputTenantSource } from "@webiny/api-core/features/tenancy/TenantScopes/index.js";

/**
 * EXTRACT (transport-specific): an S3 event runs in the tenant its bucket name starts with
 * (convention "<tenant>-…" → "<tenant>"). S3 events carry no user identity, so no auth token is
 * extracted. The bucket-name prefix isn't always a tenant id, so an unknown one runs as the root
 * tenant instead of failing the event.
 *
 * Not registered by any handler yet.
 */
class S3TenantSourceImpl implements InputTenantSource.Interface {
    getTenant(request: InputChainRunner.Request): InputTenantSource.Tenant | undefined {
        if (request.abstraction !== S3InputHandler) {
            return undefined;
        }
        const bucket: string | undefined = request.input?.Records?.[0]?.s3?.bucket?.name;
        return { tenantId: bucket ? bucket.split("-")[0] || null : null, ifUnknown: "root" };
    }
}

export const S3TenantSource = InputTenantSource.createImplementation({
    implementation: S3TenantSourceImpl,
    dependencies: []
});
