import type { S3 } from "@webiny/aws-sdk/client-s3/index.js";
import type { AssetRequest, AssetResolver } from "@webiny/api-file-manager";
import { Asset } from "@webiny/api-file-manager";
import { AssetResolver as AssetResolverAbstraction } from "@webiny/api-file-manager/features/assetDelivery/abstractions.js";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { S3ContentsReader } from "~/assetDelivery/index.js";
import { ObjectKey } from "~/assetDelivery/threatDetection/ObjectKey.js";
import { S3Client, S3Bucket } from "~/assetDelivery/abstractions.js";

interface AssetMetadata {
    id: string;
    tenant: string;
    size: number;
    contentType: string;
    bucketKey: string;
}

export class S3AssetResolver implements AssetResolver {
    constructor(
        private keyValueStore: GlobalKeyValueStore.Interface,
        private s3: S3,
        private bucket: string
    ) {}

    async resolve(request: AssetRequest): Promise<Asset | undefined> {
        const fileId = ObjectKey.from(request.getKey()).id();
        const result = await this.keyValueStore.get<AssetMetadata>(
            `FileManager/File/${fileId}/Metadata`
        );

        if (result.isFail()) {
            return undefined;
        }

        const metadata = result.value;

        const asset = new Asset({
            id: metadata.id,
            tenant: metadata.tenant,
            size: metadata.size,
            contentType: metadata.contentType,
            key: metadata.bucketKey
        });

        asset.setContentsReader(new S3ContentsReader(this.s3, this.bucket));

        return asset;
    }
}

export const S3AssetResolverImpl = AssetResolverAbstraction.createImplementation({
    implementation: S3AssetResolver,
    dependencies: [GlobalKeyValueStore, S3Client, S3Bucket]
});
