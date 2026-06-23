import fs from "node:fs/promises";
import path from "node:path";
import type { Asset, AssetContentsReader } from "@webiny/api-file-manager";

export class LocalContentsReader implements AssetContentsReader {
    private readonly storagePath: string;

    public static create(storagePath: string) {
        return new LocalContentsReader(storagePath);
    }

    private constructor(storagePath: string) {
        this.storagePath = storagePath;
    }

    public async read(asset: Asset): Promise<Buffer> {
        const filePath = path.join(this.storagePath, asset.getKey());
        const data = await fs.readFile(filePath);
        return data;
    }
}
