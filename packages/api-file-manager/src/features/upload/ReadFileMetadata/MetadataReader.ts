import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import {
    MetadataReader as MetadataReaderAbstraction,
    type IMetadataReader,
    type AssetMetadata
} from "./abstractions.js";

class MetadataReaderImpl implements IMetadataReader {
    private readonly keyValueStore: GlobalKeyValueStore.Interface;

    public constructor(keyValueStore: GlobalKeyValueStore.Interface) {
        this.keyValueStore = keyValueStore;
    }

    public async read(fileId: string): Promise<AssetMetadata | undefined> {
        const result = await this.keyValueStore.get<AssetMetadata>(
            `FileManager/File/${fileId}/Metadata`
        );

        if (result.isFail()) {
            return undefined;
        }

        return result.value;
    }
}

export const MetadataReader = MetadataReaderAbstraction.createImplementation({
    implementation: MetadataReaderImpl,
    dependencies: [GlobalKeyValueStore]
});
