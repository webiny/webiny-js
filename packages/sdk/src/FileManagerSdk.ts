import type { WebinyConfig } from "./types.js";
import type {
    FmFile,
    FmTag,
    PresignedPostPayloadResponse
} from "./methods/fileManager/fileManagerTypes.js";
import type { GetFileParams } from "./methods/fileManager/getFile.js";
import type { ListFilesParams, ListFilesResult } from "./methods/fileManager/listFiles.js";
import type { CreateFileParams } from "./methods/fileManager/createFile.js";
import type { CreateFilesParams, CreateFilesResult } from "./methods/fileManager/createFiles.js";
import type { UpdateFileParams } from "./methods/fileManager/updateFile.js";
import type { DeleteFileParams } from "./methods/fileManager/deleteFile.js";
import type { ListTagsParams } from "./methods/fileManager/listTags.js";
import type { GetPresignedPostPayloadParams } from "./methods/fileManager/getPresignedPostPayload.js";
import type { GetPresignedPostPayloadsParams } from "./methods/fileManager/getPresignedPostPayloads.js";
import type {
    CreateMultiPartUploadParams,
    MultiPartUploadResponse
} from "./methods/fileManager/createMultiPartUpload.js";
import type { CompleteMultiPartUploadParams } from "./methods/fileManager/completeMultiPartUpload.js";
import type { HttpError, GraphQLError, NetworkError } from "./errors.js";
import type { Result } from "./Result.js";
import { getFile as getFileFn } from "./methods/fileManager/getFile.js";
import { listFiles as listFilesFn } from "./methods/fileManager/listFiles.js";
import { createFile as createFileFn } from "./methods/fileManager/createFile.js";
import { createFiles as createFilesFn } from "./methods/fileManager/createFiles.js";
import { updateFile as updateFileFn } from "./methods/fileManager/updateFile.js";
import { deleteFile as deleteFileFn } from "./methods/fileManager/deleteFile.js";
import { listTags as listTagsFn } from "./methods/fileManager/listTags.js";
import { getPresignedPostPayload as getPresignedPostPayloadFn } from "./methods/fileManager/getPresignedPostPayload.js";
import { getPresignedPostPayloads as getPresignedPostPayloadsFn } from "./methods/fileManager/getPresignedPostPayloads.js";
import { createMultiPartUpload as createMultiPartUploadFn } from "./methods/fileManager/createMultiPartUpload.js";
import { completeMultiPartUpload as completeMultiPartUploadFn } from "./methods/fileManager/completeMultiPartUpload.js";

export class FileManagerSdk {
    private config: WebinyConfig;
    private fetchFn: typeof fetch;

    constructor(config: WebinyConfig) {
        this.config = config;
        this.fetchFn = config.fetch || fetch;
    }

    async getFile(
        params: GetFileParams
    ): Promise<Result<FmFile, HttpError | GraphQLError | NetworkError>> {
        return getFileFn(this.config, this.fetchFn, params);
    }

    async listFiles(
        params?: ListFilesParams
    ): Promise<Result<ListFilesResult, HttpError | GraphQLError | NetworkError>> {
        return listFilesFn(this.config, this.fetchFn, params);
    }

    async createFile(
        params: CreateFileParams
    ): Promise<Result<FmFile, HttpError | GraphQLError | NetworkError>> {
        return createFileFn(this.config, this.fetchFn, params);
    }

    async createFiles(
        params: CreateFilesParams
    ): Promise<Result<CreateFilesResult, HttpError | GraphQLError | NetworkError>> {
        return createFilesFn(this.config, this.fetchFn, params);
    }

    async updateFile(
        params: UpdateFileParams
    ): Promise<Result<FmFile, HttpError | GraphQLError | NetworkError>> {
        return updateFileFn(this.config, this.fetchFn, params);
    }

    async deleteFile(
        params: DeleteFileParams
    ): Promise<Result<boolean, HttpError | GraphQLError | NetworkError>> {
        return deleteFileFn(this.config, this.fetchFn, params);
    }

    async listTags(
        params?: ListTagsParams
    ): Promise<Result<FmTag[], HttpError | GraphQLError | NetworkError>> {
        return listTagsFn(this.config, this.fetchFn, params);
    }

    async getPresignedPostPayload(
        params: GetPresignedPostPayloadParams
    ): Promise<Result<PresignedPostPayloadResponse, HttpError | GraphQLError | NetworkError>> {
        return getPresignedPostPayloadFn(this.config, this.fetchFn, params);
    }

    async getPresignedPostPayloads(
        params: GetPresignedPostPayloadsParams
    ): Promise<Result<PresignedPostPayloadResponse[], HttpError | GraphQLError | NetworkError>> {
        return getPresignedPostPayloadsFn(this.config, this.fetchFn, params);
    }

    async createMultiPartUpload(
        params: CreateMultiPartUploadParams
    ): Promise<Result<MultiPartUploadResponse, HttpError | GraphQLError | NetworkError>> {
        return createMultiPartUploadFn(this.config, this.fetchFn, params);
    }

    async completeMultiPartUpload(
        params: CompleteMultiPartUploadParams
    ): Promise<Result<boolean, HttpError | GraphQLError | NetworkError>> {
        return completeMultiPartUploadFn(this.config, this.fetchFn, params);
    }
}
