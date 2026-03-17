// File Manager SDK type declarations.
export const FILE_MANAGER_DECLARATIONS = `
interface SdkFmIdentity {
    id: string;
    displayName: string;
    type: string;
}

interface SdkFmLocation {
    folderId: string;
}

interface SdkFmFile {
    id: string;
    createdOn: string;
    modifiedOn?: string;
    savedOn: string;
    createdBy: SdkFmIdentity;
    modifiedBy?: SdkFmIdentity;
    savedBy: SdkFmIdentity;
    location: SdkFmLocation;
    src?: string;
    name?: string;
    key?: string;
    type?: string;
    size?: number;
    tags?: string[];
    [key: string]: any;
}

interface SdkFmTag {
    tag: string;
    count: number;
}

interface SdkUploadProgress {
    sent: number;
    total: number;
    percentage: number;
}

type SdkBatchUploadStrategy = "fail-fast" | "continue";

interface SdkGetFileParams {
    /** ID of the file to get. */
    id: string;
}

interface SdkListFilesParams {
    /** Search query. */
    search?: string;
    /** Filter conditions. */
    where?: {
        location?: {
            folderId?: string;
            folderId_in?: string[];
        };
        name?: string;
        name_contains?: string;
        type?: string;
        type_in?: string[];
        tags?: string[];
        tags_in?: string[];
    };
    /** Maximum number of items to return. */
    limit?: number;
    /** Cursor for pagination. */
    after?: string;
    /** Sort order. */
    sort?: ("savedOn_ASC" | "savedOn_DESC" | "createdOn_ASC" | "createdOn_DESC" | "name_ASC" | "name_DESC" | "size_ASC" | "size_DESC")[];
}

interface SdkListFilesResult {
    data: SdkFmFile[];
    meta: {
        cursor: string | null;
        hasMoreItems: boolean;
        totalCount: number;
    };
}

interface SdkCreateFileParams {
    /** Optional: The actual file content to upload (Buffer in Node.js, File/Blob in browser). */
    file?: any;
    /** The file metadata. */
    data: {
        id?: string;
        name?: string;
        key?: string;
        keyPrefix?: string;
        type?: string;
        size?: number;
        tags?: string[];
        location?: { folderId: string };
        [key: string]: any;
    };
    /** Optional: Progress callback. */
    onProgress?: (progress: SdkUploadProgress) => void;
    /** Optional: Threshold in MB for multi-part upload (default: 100). */
    multiPartThreshold?: number;
    /** Optional: AbortSignal for cancellation. */
    signal?: AbortSignal;
}

interface SdkCreateFilesParams {
    /** Array of files with their data. */
    files: Array<{
        file?: any;
        data: {
            id?: string;
            name?: string;
            key?: string;
            keyPrefix?: string;
            type?: string;
            size?: number;
            tags?: string[];
            location?: { folderId: string };
            [key: string]: any;
        };
        onProgress?: (progress: SdkUploadProgress) => void;
    }>;
    /** Optional: Threshold in MB for multi-part upload (default: 100). */
    multiPartThreshold?: number;
    /** Optional: Number of concurrent uploads (default: 5). */
    concurrency?: number;
    /** Optional: Batch upload strategy (default: "fail-fast"). */
    strategy?: SdkBatchUploadStrategy;
    /** Optional: AbortSignal for cancellation. */
    signal?: AbortSignal;
}

interface SdkCreateFilesResult {
    successful: SdkFmFile[];
    failed: Array<{
        data: any;
        error: Error;
    }>;
}

interface SdkUpdateFileParams {
    /** ID of the file to update. */
    id: string;
    /** The file data to update. */
    data: {
        name?: string;
        tags?: string[];
        location?: { folderId: string };
        [key: string]: any;
    };
}

interface SdkDeleteFileParams {
    /** ID of the file to delete. */
    id: string;
}

interface SdkListTagsParams {
    /** Filter conditions. */
    where?: {
        createdBy?: string;
        tags_startsWith?: string;
        tags_not_startsWith?: string;
    };
}

interface SdkFileManager {
    /** Get a single file by ID. */
    getFile(params: SdkGetFileParams): Promise<SdkResult<SdkFmFile, SdkError>>;

    /** List files with optional filtering, sorting, and pagination. */
    listFiles(params?: SdkListFilesParams): Promise<SdkResult<SdkListFilesResult, SdkError>>;

    /** 
     * Create a new file. If 'file' is provided, uploads to S3 first.
     * If no 'file' is provided, only creates metadata record.
     */
    createFile(params: SdkCreateFileParams): Promise<SdkResult<SdkFmFile, SdkError>>;

    /** 
     * Create multiple files. If 'file' is provided for each, uploads to S3 first.
     * Supports batch upload with configurable concurrency and error handling strategy.
     */
    createFiles(params: SdkCreateFilesParams): Promise<SdkResult<SdkCreateFilesResult, SdkError>>;

    /** Update a file's metadata. */
    updateFile(params: SdkUpdateFileParams): Promise<SdkResult<SdkFmFile, SdkError>>;

    /** Delete a file. */
    deleteFile(params: SdkDeleteFileParams): Promise<SdkResult<boolean, SdkError>>;

    /** List tags with optional filtering. */
    listTags(params?: SdkListTagsParams): Promise<SdkResult<SdkFmTag[], SdkError>>;
}
`;
