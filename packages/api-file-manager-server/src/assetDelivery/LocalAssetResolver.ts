import type { AssetRequest, AssetResolver } from "@webiny/api-file-manager";
import { Asset } from "@webiny/api-file-manager";
import { AssetResolver as AssetResolverAbstraction } from "@webiny/api-file-manager/features/assetDelivery/abstractions.js";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { ObjectKey } from "@webiny/api-file-manager/features/assetDelivery/ObjectKey/index.js";
import { LocalContentsReader } from "~/assetDelivery/LocalContentsReader.js";
import { LocalStoragePath } from "~/assetDelivery/abstractions.js";

interface AssetMetadata {
    id: string;
    tenant: string;
    size: number;
    contentType: string;
    bucketKey: string;
}

export class LocalAssetResolver implements AssetResolver {
    constructor(
        private readonly keyValueStore: GlobalKeyValueStore.Interface,
        private readonly storagePath: string,
        private readonly objectKey: ObjectKey.Interface
    ) {}

    async resolve(request: AssetRequest): Promise<Asset | undefined> {
        const objectKey = this.objectKey.from(request.getKey());
        const fileId = objectKey.id();
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

        asset.setContentsReader(new LocalContentsReader(this.storagePath));

        return asset;
    }
}

export const LocalAssetResolverImpl = AssetResolverAbstraction.createImplementation({
    implementation: LocalAssetResolver,
    dependencies: [GlobalKeyValueStore, LocalStoragePath, ObjectKey]
});
