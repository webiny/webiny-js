export interface FileItem {
    id: string;
    name: string;
    key: string;
    src: string;
    size: number;
    type: string;
    tags: string[];
    createdOn: string;
    createdBy: {
        id: string;
    };
    [key: string]: any;
}
export interface CreateFileResponse {
    fileManager: {
        createFile: {
            data: FileItem;
            error?: Error | null;
        };
    };
}
export interface UpdateFileResponse {
    fileManager: {
        updateFile: {
            data: FileItem;
            error?: Error | null;
        };
    };
}
export interface ListFilesListFilesResponse {
    data: FileItem[];
    error?: Error | null;
    meta: {
        hasMoreItems: boolean;
        totalItem: number;
        cursor: string | null;
    };
}
export interface ListFilesResponse {
    fileManager: {
        listFiles: ListFilesListFilesResponse;
    };
}

export interface ListFileTagsResponse {
    fileManager: {
        listTags: string[];
        error: Error | null;
    };
}
