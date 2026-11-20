// The File Manager's gateways and uploader, for extensions that decorate them (e.g. to scope every
// file to a tenant's own part of the library) and for tests that register their own implementations.
export { ListFilesGateway } from "~/features/listFiles/abstractions.js";
export type {
    ListFilesGatewayParams,
    ListFilesGatewayResult
} from "~/features/listFiles/abstractions.js";
export { ListTagsGateway } from "~/features/tags/abstractions.js";
export type { ListTagsGatewayParams, ListTagsGatewayResult } from "~/features/tags/abstractions.js";
export { UpdateFileGateway } from "~/features/updateFile/abstractions.js";
export type { UpdateFileGatewayParams } from "~/features/updateFile/abstractions.js";
export { FileUploader } from "~/features/fileUploader/abstractions.js";
export type {
    UploadFileData,
    BatchUploadOptions,
    FileUploaderViewModel
} from "~/features/fileUploader/abstractions.js";
export type { FmFile, FmTag } from "~/features/shared/types.js";
