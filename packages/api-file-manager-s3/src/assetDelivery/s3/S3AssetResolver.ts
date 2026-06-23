import type { S3 } from "@webiny/aws-sdk/client-s3/index.js";
import type { AssetRequest, AssetResolver } from "@webiny/api-file-manager";
import {
    AssetFactory,
    AssetResolver as AssetResolverAbstraction,
    ObjectKey
} from "@webiny/api-file-manager/exports/api/file-manager/assetDelivery.js";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { S3ContentsReader } from "~/assetDelivery/index.js";
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
        private readonly keyValueStore: GlobalKeyValueStore.Interface,
        private readonly s3: S3,
        private readonly bucket: string,
        private readonly objectKey: ObjectKey.Interface,
        private readonly assetFactory: AssetFactory.Interface
    ) {}

    async resolve(request: AssetRequest): Promise<AssetFactory.Asset | undefined> {
        const fileId = this.objectKey.from(request.getKey()).id();
        const result = await this.keyValueStore.get<AssetMetadata>(
            `FileManager/File/${fileId}/Metadata`
        );

        if (result.isFail()) {
            return undefined;
        }

        const metadata = result.value;

        const asset = this.assetFactory.create({
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
    dependencies: [GlobalKeyValueStore, S3Client, S3Bucket, ObjectKey, AssetFactory]
});
