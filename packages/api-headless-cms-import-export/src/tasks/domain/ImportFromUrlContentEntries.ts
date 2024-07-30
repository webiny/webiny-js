import { ITaskResponseResult, ITaskRunParams } from "@webiny/tasks/types";
import {
    IImportFromUrlContentEntries,
    IImportFromUrlContentEntriesInput,
    IImportFromUrlContentEntriesOutput
} from "~/tasks/domain/abstractions/ImportFromUrlContentEntries";
import { Context } from "~/types";
import { createS3Client } from "~/tasks/utils/helpers/s3Client";
import { getBucket } from "~/tasks/utils/helpers/getBucket";
import { createUploadFactory } from "~/tasks/utils/upload";
import { createImportFromUrlContentEntriesCombined } from "./importFromUrlContentEntries/index";

export class ImportFromUrlContentEntries<
    C extends Context = Context,
    I extends IImportFromUrlContentEntriesInput = IImportFromUrlContentEntriesInput,
    O extends IImportFromUrlContentEntriesOutput = IImportFromUrlContentEntriesOutput
> implements IImportFromUrlContentEntries<C, I, O>
{
    public async run(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>> {
        const { context, response, input, isCloseToTimeout, isAborted } = params;

        if (!input.modelId) {
            return response.error({
                message: `Missing "modelId" in the input.`,
                code: "MISSING_MODEL_ID"
            });
        } else if (!input.file) {
            return response.error({
                message: `No file found in the provided data.`,
                code: "NO_FILE_FOUND"
            });
        }

        try {
            await context.cms.getModel(input.modelId);
        } catch (ex) {
            return response.error({
                message: `Model "${input.modelId}" not found.`,
                code: "MODEL_NOT_FOUND"
            });
        }

        const client = createS3Client();
        /**
         * First we need to download the combined content entries file.
         */
        if (!input.combinedFile?.done) {
            const combined = createImportFromUrlContentEntriesCombined({
                fetch,
                file: input.file,
                input: input.combinedFile,
                createUpload: createUploadFactory({
                    client,
                    bucket: getBucket()
                })
            });
            let result: string;
            try {
                result = await combined.process(async ({ stop }) => {
                    const isClose = isCloseToTimeout();
                    if (isClose) {
                        return stop("continue");
                    } else if (isAborted()) {
                        return stop("aborted");
                    }
                });
            } catch (ex) {
                return response.error(ex);
            }
            if (result === "continue") {
                return response.continue({
                    ...input,
                    combinedFile: {
                        done: combined.isDone(),
                        next: combined.getNext()
                    }
                });
            } else if (result === "aborted") {
                return response.aborted();
            }

            return response.continue({
                ...input,
                combinedFile: {
                    done: combined.isDone(),
                    next: combined.getNext()
                }
            });
        }

        return response.error({
            message: "Method not implemented."
        });
    }
}
