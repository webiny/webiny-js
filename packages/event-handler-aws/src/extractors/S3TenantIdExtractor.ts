import { Abstraction } from "@webiny/di";
import type { S3Event } from "@webiny/aws-sdk/types/index.js";

export interface IS3TenantIdExtractor {
    extract(event: S3Event): string | undefined;
}

export const S3TenantIdExtractor = new Abstraction<IS3TenantIdExtractor>("S3TenantIdExtractor");

export namespace S3TenantIdExtractor {
    export type Interface = IS3TenantIdExtractor;
}

class DefaultS3TenantIdExtractor implements IS3TenantIdExtractor {
    extract(event: S3Event): string | undefined {
        // Extracts from bucket name pattern: "tenant-uploads" → "tenant"
        const bucket = event.Records[0]?.s3.bucket.name;
        if (!bucket) {
            return undefined;
        }
        return bucket.split("-")[0];
    }
}

export const S3TenantIdExtractorImpl = S3TenantIdExtractor.createImplementation({
    implementation: DefaultS3TenantIdExtractor,
    dependencies: []
});
