import {
    AssetFactory,
    AssetResolver as AssetResolverAbstraction,
    ObjectKey
} from "@webiny/api-file-manager/exports/api/file-manager/assetDelivery.js";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { ObjectStorageContentsReader } from "~/assetDelivery/ObjectStorageContentsReader.js";
import { ObjectStorage } from "~/features/ObjectStorage/abstractions.js";

interface AssetMetadata {
    id: string;
    tenant: string;
    size: number;
    contentType: string;
    bucketKey: string;
}

class AssetResolverImpl implements AssetResolverAbstraction.Interface {
    constructor(
        private readonly keyValueStore: GlobalKeyValueStore.Interface,
        private readonly objectStorage: ObjectStorage.Interface,
        private readonly objectKey: ObjectKey.Interface,
        private readonly assetFactory: AssetFactory.Interface
    ) {}

    async resolve(
        request: AssetResolverAbstraction.Request
    ): Promise<AssetFactory.Asset | undefined> {
        const objectKey = this.objectKey.from(request.getKey());
        const fileId = objectKey.id();
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

        const contentsReader = ObjectStorageContentsReader.create(this.objectStorage);
        asset.setContentsReader(contentsReader);

        return asset;
    }
}

export const LocalAssetResolver = AssetResolverAbstraction.createImplementation({
    implementation: AssetResolverImpl,
    dependencies: [GlobalKeyValueStore, ObjectStorage, ObjectKey, AssetFactory]
});
