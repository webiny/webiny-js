import type {
    IValidateImportFromUrl,
    IValidateImportFromUrlInput,
    IValidateImportFromUrlOutput
} from "~/tasks/domain/abstractions/ValidateImportFromUrl";
import type { IExternalFileFetcher } from "~/tasks/utils/externalFileFetcher";
import type { ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";
import type { Context, ICmsImportExportValidatedFile } from "~/types";
import { getImportExportFileType } from "~/tasks/utils/helpers/getImportExportFileType";
import type { NonEmptyArray } from "@webiny/api/types";
import { prependImportPath } from "~/tasks/utils/helpers/importPath";

export interface IFileExists {
    (key: string): Promise<boolean>;
}

export interface IValidateImportFromUrlParams {
    fileFetcher: IExternalFileFetcher;
    fileExists: IFileExists;
}

export class ValidateImportFromUrl<
    C extends Context = Context,
    I extends IValidateImportFromUrlInput = IValidateImportFromUrlInput,
    O extends IValidateImportFromUrlOutput = IValidateImportFromUrlOutput
> implements IValidateImportFromUrl<C, I, O>
{
    private readonly fileFetcher: IExternalFileFetcher;
    private readonly fileExists: IFileExists;

    public constructor(params: IValidateImportFromUrlParams) {
        this.fileFetcher = params.fileFetcher;
        this.fileExists = params.fileExists;
    }

    public async run(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>> {
        const { response, input } = params;

        const { files = [], model } = input;

        const results: ICmsImportExportValidatedFile[] = [];

        for (const target of files) {
            const { get, head, checksum } = target;
            const { type, pathname, error: fileTypeError } = getImportExportFileType(head);
            if (fileTypeError) {
                results.push({
                    checked: true,
                    get,
                    head,
                    key: target.key,
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
            const key = prependImportPath(target.key);
            const exists = await this.fileExists(key);
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
                            key
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
                type
            });
        }
        if (results.length === 0) {
            return response.error({
                message: "No files found.",
                code: "NO_FILES_FOUND"
            });
        }

        const output: IValidateImportFromUrlOutput = {
            files: results as NonEmptyArray<ICmsImportExportValidatedFile>,
            modelId: model?.modelId
        };
        const filesWithErrors = results.filter(file => !!file.error);
        if (filesWithErrors.length > 0) {
            output.error = {
                message: "One or more files are invalid.",
                code: "INVALID_FILES",
                data: {
                    files: filesWithErrors.map(file => {
                        return file.key;
                    })
                }
            };
        }

        return response.done(output as O);
    }
}
