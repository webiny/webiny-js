import { createAbstraction } from "@webiny/feature/api";

export interface AssetMetadata {
    id: string;
    tenant: string;
    size: number;
    contentType: string;
    bucketKey: string;
}

export interface IMetadataReader {
    read(fileId: string): Promise<AssetMetadata | undefined>;
}

export const MetadataReader = createAbstraction<IMetadataReader>(
    "FileManager/Upload/MetadataReader"
);

export namespace MetadataReader {
    export type Interface = IMetadataReader;
    export type Metadata = AssetMetadata;
}
