import {
    IValidateImportFromUrl,
    IValidateImportFromUrlInput,
    IValidateImportFromUrlOutput
} from "~/tasks/domain/abstractions/ValidateImportFromUrl";
import { IExternalFileFetcher } from "~/tasks/utils/externalFileHeadFetcher";
import { ITaskResponseResult, ITaskRunParams } from "@webiny/tasks";
import { Context, ICmsImportExportValidatedFile } from "~/types";
import { getImportExportFileType } from "~/tasks/utils/helpers/getImportExportFileType";

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

        const { files, lastIndex } = input;

        const results: ICmsImportExportValidatedFile[] = [];

        for (const index in files) {
            if (lastIndex !== undefined && Number(index) <= lastIndex) {
                continue;
            }

            const target = files[index];
            const { get, head } = target;
            const type = getImportExportFileType(head);
            if (!type) {
                results.push({
                    get,
                    head,
                    error: {
                        message: "File type not supported.",
                        data: {
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
                    size: undefined,
                    type: undefined
                });
                continue;
            } else if (!file) {
                results.push({
                    get,
                    head,
                    error: {
                        message: "File not found."
                    },
                    size: undefined,
                    type: undefined
                });
                continue;
            }
            results.push({
                get,
                head,
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

        return response.done({
            files: results
        } as O);
    }
}
