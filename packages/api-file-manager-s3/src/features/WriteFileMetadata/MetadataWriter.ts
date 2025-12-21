import { TenantContext } from "@webiny/api-core/features/TenantContext";
import { S3 } from "@webiny/aws-sdk/client-s3/index.js";
import type { File } from "@webiny/api-file-manager/domain/file/types.js";
import { executeWithRetry } from "@webiny/utils";

export class MetadataWriter {
    private readonly bucket: string;
    private tenantContext: TenantContext.Interface;

    constructor(tenantContext: TenantContext.Interface, bucket: string) {
        this.tenantContext = tenantContext;
        this.bucket = bucket;
    }

    async write(files: File[]) {
        const s3 = this.getS3();

        /**
         * We need to write each file with retry.
         */
        const writers = files.map(file => {
            const writer = () => {
                return s3.putObject({
                    Bucket: this.bucket,
                    Key: `${file.key}.metadata`,
                    Body: JSON.stringify(this.getMetadata(file)),
                    ContentType: "application/json",
                    CacheControl: "max-age=31536000"
                });
            };

            return executeWithRetry(writer);
        });

        await Promise.all(writers);
    }

    private getS3() {
        return new S3({ region: process.env.AWS_REGION });
    }

    private getMetadata(file: File) {
        const tenant = this.tenantContext.getTenant();
        return {
            id: file.id,
            tenant: tenant.id,
            size: file.size,
            contentType: file.type
        };
    }
}
