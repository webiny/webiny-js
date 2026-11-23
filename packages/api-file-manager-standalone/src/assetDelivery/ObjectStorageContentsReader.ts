import type { AssetContentsReader } from "@webiny/api-file-manager/exports/api/file-manager/assetDelivery.js";
import type { ObjectStorage } from "@webiny/api-object-storage";

export class ObjectStorageContentsReader implements AssetContentsReader.Interface {
    private readonly objectStorage: ObjectStorage.Interface;

    public static create(objectStorage: ObjectStorage.Interface) {
        return new ObjectStorageContentsReader(objectStorage);
    }

    private constructor(objectStorage: ObjectStorage.Interface) {
        this.objectStorage = objectStorage;
    }

    public async read(asset: AssetContentsReader.Asset): Promise<Buffer> {
        const key = asset.getKey();
        const data = await this.objectStorage.get(key);
        if (!data) {
            throw new Error(`No contents stored for asset "${key}".`);
        }
        return data;
    }
}
