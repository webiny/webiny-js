import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";

interface AssetMetadata {
    id: string;
    tenant: string;
    size: number;
    contentType: string;
    bucketKey: string;
}

export class MetadataReader {
    constructor(private keyValueStore: GlobalKeyValueStore.Interface) {}

    async read(fileId: string): Promise<AssetMetadata | undefined> {
        const result = await this.keyValueStore.get<AssetMetadata>(
            `FileManager/File/${fileId}/Metadata`
        );

        if (result.isFail()) {
            return undefined;
        }

        return result.value;
    }
}
