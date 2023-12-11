import { AssetResolver } from "~/delivery/AssetDelivery/abstractions/AssetResolver";
import { AssetRequest } from "~/delivery/AssetDelivery/AssetRequest";
import { ResolvedAsset } from "~/delivery/AssetDelivery/ResolvedAsset";
import { S3FileMetadataReader } from "~/delivery/S3FileMetadataReader";

export class S3AssetResolver implements AssetResolver {
    private readonly metadataReader: S3FileMetadataReader;

    constructor(metadataReader: S3FileMetadataReader) {
        this.metadataReader = metadataReader;
    }

    async resolve(request: AssetRequest): Promise<ResolvedAsset | undefined> {
        try {
            const metadata = await this.metadataReader.getMetadata(request.getKey());

            return ResolvedAsset.create({
                id: metadata.id,
                tenant: metadata.tenant,
                locale: metadata.locale,
                size: metadata.size,
                contentType: metadata.contentType,
                key: request.getKey()
            });
        } catch (error) {
            console.error(error);
            return undefined;
        }
    }
}
