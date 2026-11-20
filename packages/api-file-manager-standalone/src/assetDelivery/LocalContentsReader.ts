import fs from "node:fs/promises";
import type { AssetContentsReader } from "@webiny/api-file-manager/exports/api/file-manager/assetDelivery.js";
import { resolveTenantFilePath } from "~/utils/storagePaths.js";

export class LocalContentsReader implements AssetContentsReader.Interface {
    private readonly storagePath: string;

    public static create(storagePath: string) {
        return new LocalContentsReader(storagePath);
    }

    private constructor(storagePath: string) {
        this.storagePath = storagePath;
    }

    public async read(asset: AssetContentsReader.Asset): Promise<Buffer> {
        // Security: the key comes from the file record, never read outside the tenant's files.
        const filePath = resolveTenantFilePath(this.storagePath, asset.getTenant(), asset.getKey());
        const data = await fs.readFile(filePath);
        return data;
    }
}
