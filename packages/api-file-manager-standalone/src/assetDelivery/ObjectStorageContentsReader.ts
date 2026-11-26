import type { AssetContentsReader } from "@webiny/api-file-manager/exports/api/file-manager/assetDelivery.js";
import type { ObjectStorage } from "@webiny/api-object-storage";
import { isTenantFileKey } from "~/utils/isTenantFileKey.js";

export class ObjectStorageContentsReader implements AssetContentsReader.Interface {
    private readonly objectStorage: ObjectStorage.Interface;

    public static create(objectStorage: ObjectStorage.Interface) {
        return new ObjectStorageContentsReader(objectStorage);
    }

    private constructor(objectStorage: ObjectStorage.Interface) {
        this.objectStorage = objectStorage;
    }

    public async read(asset: AssetContentsReader.Asset): Promise<Buffer> {
        const key = this.getTenantFileKey(asset);
        const data = await this.objectStorage.get(key);
        if (!data) {
            throw new Error(`No contents stored for asset "${key}".`);
        }
        return data;
    }

    public async readStream(asset: AssetContentsReader.Asset): Promise<AsyncIterable<Uint8Array>> {
        const key = this.getTenantFileKey(asset);
        const stream = await this.objectStorage.getStream(key);
        if (!stream) {
            throw new Error(`No contents stored for asset "${key}".`);
        }
        return stream.body;
    }

    // Security: the key comes from the file record, never read outside the tenant's files.
    private getTenantFileKey(asset: AssetContentsReader.Asset): string {
        const key = asset.getKey();
        if (!isTenantFileKey(asset.getTenant(), key)) {
            throw new Error(`Asset "${key}" is outside of the tenant's files.`);
        }
        return key;
    }
}
