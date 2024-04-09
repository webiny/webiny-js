import { S3 } from "@webiny/aws-sdk/client-s3";
import { Asset, AssetRequest, AssetResolver } from "@webiny/api-file-manager";
import { S3AssetMetadataReader } from "./S3AssetMetadataReader";
import { S3ContentsReader } from "./S3ContentsReader";

export class S3AssetResolver implements AssetResolver {
    private readonly s3: S3;
    private readonly bucket: string;

    constructor(s3: S3, bucket: string) {
        this.s3 = s3;
        this.bucket = bucket;
    }

    async resolve(request: AssetRequest): Promise<Asset | undefined> {
        try {
            const metadataReader = new S3AssetMetadataReader(this.s3, this.bucket);
            const metadata = await metadataReader.getMetadata(request.getKey());

            const asset = new Asset({
                id: metadata.id,
                tenant: metadata.tenant,
                locale: metadata.locale,
                size: metadata.size,
                contentType: metadata.contentType,
                key: request.getKey()
            });

            asset.setContentsReader(new S3ContentsReader(this.s3, this.bucket));

            return asset;
        } catch (error) {
            console.log(`S3AssetResolver failed to read metadata: ${error.message}`);
            return undefined;
        }
    }
}
