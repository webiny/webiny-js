// Re-export domain types from @webiny/sdk for use within app-file-manager.
export type {
    FmFile,
    FmIdentity,
    FmLocation,
    FmTag,
    FmListMeta,
    FmFileListWhereInput,
    FmFileListSorter,
    FmTagsListWhereInput,
    UploadProgress,
    PresignedPostPayload,
    PresignedPostPayloadResponse,
    ListFilesParams
} from "@webiny/sdk";

import type { FmFile } from "@webiny/sdk";
import type { UploadProgress } from "@webiny/sdk";

// App-specific types not defined in the SDK.

export interface FmSettings {
    uploadMinFileSize: string;
    uploadMaxFileSize: string;
    srcPrefix: string;
}

export interface UploadJob {
    id: string;
    fileName: string;
    status: "pending" | "uploading" | "completed" | "failed";
    progress: UploadProgress;
    error?: string;
    result?: FmFile;
}
