import fs from "node:fs/promises";
import path from "node:path";
import type { AssetContentsReader } from "@webiny/api-file-manager/exports/api/file-manager/assetDelivery.js";

export class LocalContentsReader implements AssetContentsReader.Interface {
    private readonly storagePath: string;

    public static create(storagePath: string) {
        return new LocalContentsReader(storagePath);
    }

    private constructor(storagePath: string) {
        this.storagePath = storagePath;
    }

    public async read(asset: AssetContentsReader.Asset): Promise<Buffer> {
        const filePath = path.join(this.storagePath, asset.getKey());
        const data = await fs.readFile(filePath);
        return data;
    }
}
