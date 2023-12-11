export interface FileMetadata {
    id: string;
    tenant: string;
    locale: string;
    size: number;
    contentType: string;
}

export interface FileMetadataReader<T extends FileMetadata = FileMetadata> {
    getMetadata(key: string): Promise<T>;
}
