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

export interface FmSettingsInput {
    uploadMinFileSize: string;
    uploadMaxFileSize: string;
    /** A custom file delivery URL. Empty means "use the default". */
    srcPrefix: string;
}

export interface FmSettings extends FmSettingsInput {
    /** The file delivery URL in effect: the custom one, or the default when none is set. */
    srcPrefix: string;
    /** The file delivery URL used when no custom one is set: the API's public URL plus `/files/`. */
    defaultSrcPrefix: string;
}

export interface UploadJob {
    id: string;
    fileName: string;
    status: "pending" | "uploading" | "completed" | "failed";
    progress: UploadProgress;
    error?: string;
    result?: FmFile;
}
