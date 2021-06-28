import { File } from "@webiny/api-file-manager/types";

export interface FileIndexTransformToConfig {
    /**
     * Original file data before any toIndex transformations.
     */
    original: File;
    /**
     * The file data we need to return every time a transform is performed.
     */
    file: File;
}

export interface FileIndexTransformFromConfig {
    /**
     * The file data we need to return every time a transform is performed.
     */
    file: File;
}

export interface FileIndexTransformPluginConfig {
    /**
     * Transform the file data to be saved into the index.
     */
    toIndex: (params: FileIndexTransformToConfig) => Promise<File>;
    /**
     * What ever is done in the toIndex method MUST be reverted in this one.
     */
    fromIndex: (params: FileIndexTransformFromConfig) => Promise<File>;
}
