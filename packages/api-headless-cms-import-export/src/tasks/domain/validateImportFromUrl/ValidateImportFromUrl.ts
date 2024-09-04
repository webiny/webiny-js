import {
    IValidateImportFromUrl,
    IValidateImportFromUrlInput,
    IValidateImportFromUrlOutput
} from "~/tasks/domain/abstractions/ValidateImportFromUrl";
import { IExternalFileFetcher } from "~/tasks/utils/externalFileFetcher";
import { ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";
import { Context, ICmsImportExportValidatedFile } from "~/types";
import { getImportExportFileType } from "~/tasks/utils/helpers/getImportExportFileType";
import { NonEmptyArray } from "@webiny/api/types";
import { HeadObjectCommand, S3Client } from "@webiny/aws-sdk/client-s3";

export interface IValidateImportFromUrlParams {
    fileFetcher: IExternalFileFetcher;
    client: S3Client;
    bucket: string;
}

export class ValidateImportFromUrl<
    C extends Context = Context,
    I extends IValidateImportFromUrlInput = IValidateImportFromUrlInput,
    O extends IValidateImportFromUrlOutput = IValidateImportFromUrlOutput
> implements IValidateImportFromUrl<C, I, O>
{
    private readonly fileFetcher: IExternalFileFetcher;
    private readonly client: S3Client;
    private readonly bucket: string;

    public constructor(params: IValidateImportFromUrlParams) {
        this.fileFetcher = params.fileFetcher;
        this.client = params.client;
        this.bucket = params.bucket;
    }

    public async run(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>> {
        const { response, input } = params;

        const { files, model } = input;

        const results: ICmsImportExportValidatedFile[] = [];

        for (const target of files) {
            const { get, head, checksum } = target;
            const { type, pathname, error: fileTypeError } = getImportExportFileType(head);
            if (fileTypeError) {
                results.push({
                    checked: true,
                    get,
                    head,
                    checksum,
                    error: {
                        message: "File type not supported.",
                        code: "FILE_TYPE_NOT_SUPPORTED",
                        data: {
                            pathname,
                            type
                        }
                    },
                    size: undefined,
                    type: undefined
                });
                continue;
            }
            const { file, error } = await this.fileFetcher.head(head);
            if (error) {
                results.push({
                    checked: true,
                    get,
                    head,
                    error,
                    key: target.key,
                    checksum,
                    size: undefined,
                    type: undefined
                });
                continue;
            } else if (!file) {
                results.push({
                    checked: true,
                    get,
                    head,
                    key: target.key,
                    checksum,
                    error: {
                        message: "File not found.",
                        code: "FILE_NOT_FOUND",
                        data: {
                            url: head
                        }
                    },
                    size: undefined,
                    type: undefined
                });
                continue;
            } else if (file.checksum !== checksum) {
                results.push({
                    checked: true,
                    get,
                    head,
                    key: target.key,
                    checksum,
                    error: {
                        message: "Checksum does not match.",
                        code: "CHECKSUM_MISMATCH",
                        data: {
                            expected: checksum,
                            received: file.checksum
                        }
                    },
                    size: file.size,
                    type
                });
                continue;
            }
            const exists = await this.fileExists(target.key);
            if (exists) {
                results.push({
                    checked: true,
                    get,
                    head,
                    key: target.key,
                    checksum,
                    error: {
                        message: "File already exists.",
                        code: "FILE_ALREADY_EXISTS",
                        data: {
                            key: target.key
                        }
                    },
                    size: file.size,
                    type
                });
                continue;
            }

            results.push({
                checked: true,
                get,
                head,
                key: target.key,
                checksum,
                size: file.size,
                type,
                error: undefined
            });
        }
        if (results.length === 0) {
            return response.error({
                message: "No files found.",
                code: "NO_FILES_FOUND"
            });
        }
        const erroredFiles = results.filter(file => !!file.error);
        if (erroredFiles.length) {
            return response.error({
                message: "Some files failed validation.",
                code: "FILES_FAILED_VALIDATION",
                data: {
                    files: erroredFiles
                }
            });
        }

        const output: IValidateImportFromUrlOutput = {
            files: results as NonEmptyArray<ICmsImportExportValidatedFile>,
            modelId: model.modelId
        };

        return response.done(output as O);
    }

    private async fileExists(key: string): Promise<boolean> {
        const cmd = new HeadObjectCommand({
            Key: key,
            Bucket: this.bucket
        });
        try {
            const result = await this.client.send(cmd);
            return result.$metadata.httpStatusCode === 200;
        } catch (ex) {
            if (ex.name === "NotFound") {
                return false;
            }
            const statusCode = ex.$metadata?.httpStatusCode;
            if (statusCode === 404) {
                return false;
            }
            throw ex;
        }
    }
}
