import {
    AssetFactory,
    AssetResolver as AssetResolverAbstraction,
    ObjectKey
} from "@webiny/api-file-manager/exports/api/file-manager/assetDelivery.js";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { LocalContentsReader } from "~/assetDelivery/LocalContentsReader.js";
import { FileManagerServerConfig } from "~/features/FileManagerServerConfig/abstractions.js";

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
        private readonly config: FileManagerServerConfig.Interface,
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

        asset.setContentsReader(LocalContentsReader.create(this.config.storagePath));

        return asset;
    }
}

export const LocalAssetResolver = AssetResolverAbstraction.createImplementation({
    implementation: AssetResolverImpl,
    dependencies: [GlobalKeyValueStore, FileManagerServerConfig, ObjectKey, AssetFactory]
});
