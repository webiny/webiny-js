import {
    AssetFactory,
    AssetResolver as AssetResolverAbstraction,
    ObjectKey
} from "@webiny/api-file-manager/exports/api/file-manager/assetDelivery.js";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { LocalContentsReader } from "~/assetDelivery/LocalContentsReader.js";
import { LocalStoragePath } from "~/assetDelivery/abstractions.js";

interface AssetMetadata {
    id: string;
    tenant: string;
    size: number;
    contentType: string;
    bucketKey: string;
}

export class LocalAssetResolver implements AssetResolverAbstraction.Interface {
    constructor(
        private readonly keyValueStore: GlobalKeyValueStore.Interface,
        private readonly storagePath: string,
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

        asset.setContentsReader(LocalContentsReader.create(this.storagePath));

        return asset;
    }
}

export const LocalAssetResolverImpl = AssetResolverAbstraction.createImplementation({
    implementation: LocalAssetResolver,
    dependencies: [GlobalKeyValueStore, LocalStoragePath, ObjectKey, AssetFactory]
});
