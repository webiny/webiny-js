import type { S3 } from "@webiny/aws-sdk/client-s3";

interface AssetMetadata {
    id: string;
    tenant: string;
    locale: string;
    size: number;
    contentType: string;
}

export class S3AssetMetadataReader {
    private readonly s3: S3;
    private readonly bucket: string;

    constructor(s3: S3, bucket: string) {
        this.bucket = bucket;
        this.s3 = s3;
    }

    async getMetadata(key: string): Promise<AssetMetadata> {
        const metadataKey = `${key}.metadata`;

        console.log("Reading metadata", metadataKey);

        const { Body } = await this.s3.getObject({
            Bucket: this.bucket,
            Key: metadataKey
        });

        if (!Body) {
            throw Error(`Missing or corrupted ${metadataKey} file!`);
        }

        const metadata = JSON.parse(await Body.transformToString());

        return {
            id: metadata.id,
            tenant: metadata.tenant,
            locale: metadata.locale,
            size: metadata.size,
            contentType: metadata.contentType
        };
    }
}
