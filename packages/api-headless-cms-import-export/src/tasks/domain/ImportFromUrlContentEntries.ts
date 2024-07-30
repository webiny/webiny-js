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
import { ImportFromUrlContentEntriesCombined } from "./importFromUrlContentEntries/index";

export class ImportFromUrlContentEntries<
    C extends Context = Context,
    I extends IImportFromUrlContentEntriesInput = IImportFromUrlContentEntriesInput,
    O extends IImportFromUrlContentEntriesOutput = IImportFromUrlContentEntriesOutput
> implements IImportFromUrlContentEntries<C, I, O>
{
    public async run(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>> {
        const { context, response, input, store, trigger, isCloseToTimeout, isAborted } = params;

        const task = store.getTask();

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
            const combined = new ImportFromUrlContentEntriesCombined({
                fetch,
                file: input.file,
                input: input.combinedFile,
                createUpload: createUploadFactory({
                    client,
                    bucket: getBucket()
                })
            });

            while (!combined.isDone()) {
                if (isCloseToTimeout()) {
                    return response.continue({
                        ...input,
                        combinedFile: combined.getValues()
                    });
                } else if (isAborted()) {
                    return response.aborted();
                }
                try {
                    await combined.process();
                } catch (ex) {
                    return response.error(ex);
                }
            }
            return response.continue({
                ...input,
                combinedFile: combined.getValues()
            });
        }

        return response.error({
            message: "Method not implemented."
        });
    }
}
