import type { S3Event } from "@webiny/aws-sdk/types/index.js";
import { TenantIdExtractor } from "@webiny/api-core/features/requestContext/index.js";

/**
 * Reads the tenant id from an S3 event's bucket name, using the convention
 * "<tenant>-uploads" → "<tenant>". Returns null for non-S3 events so it safely no-ops when
 * registered alongside other transports' extractors under the shared TenantIdExtractor token.
 */
class S3TenantIdExtractorImpl implements TenantIdExtractor.Interface {
    extract(event: unknown): string | null {
        const bucket = (event as S3Event)?.Records?.[0]?.s3?.bucket?.name;
        if (!bucket) {
            return null;
        }
        return bucket.split("-")[0] ?? null;
    }
}

export const S3TenantIdExtractor = TenantIdExtractor.createImplementation({
    implementation: S3TenantIdExtractorImpl,
    dependencies: []
});
