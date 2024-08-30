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

export interface IValidateImportFromUrlParams {
    fileFetcher: IExternalFileFetcher;
}

export class ValidateImportFromUrl<
    C extends Context = Context,
    I extends IValidateImportFromUrlInput = IValidateImportFromUrlInput,
    O extends IValidateImportFromUrlOutput = IValidateImportFromUrlOutput
> implements IValidateImportFromUrl<C, I, O>
{
    private readonly fileFetcher: IExternalFileFetcher;
    public constructor(params: IValidateImportFromUrlParams) {
        this.fileFetcher = params.fileFetcher;
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
                    get,
                    head,
                    error,
                    checksum,
                    size: undefined,
                    type: undefined
                });
                continue;
            } else if (!file) {
                results.push({
                    get,
                    head,
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
            }
            results.push({
                get,
                head,
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
}
