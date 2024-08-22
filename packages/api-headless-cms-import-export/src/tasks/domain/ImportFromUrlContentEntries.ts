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

type ProcessType = "continue" | "aborted";

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
         * If download and decompress is already done, we can now proceed with the import process.
         */
        if (input.download?.done && input.decompress?.done) {
            return response.error("Not implemented.");
        }
        /**
         * If download is done, we can now proceed with the decompress process.
         */
        //
        else if (input.download?.done) {
            return response.error("Not implemented.");
        }

        const combined = createImportFromUrlContentEntriesCombined({
            fetch,
            file: input.file,
            input: input.download,
            createUpload: createUploadFactory({
                client,
                bucket: getBucket()
            })
        });
        let result: ProcessType | "done";
        try {
            result = await combined.process<ProcessType>(async ({ stop }) => {
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

        switch (result) {
            case "aborted":
                return response.aborted();
            case "continue":
            case null:
                return response.continue({
                    ...input,
                    download: {
                        done: combined.isDone(),
                        next: combined.getNext()
                    }
                });
            /**
             * There should be nothing else other than "continue" or "aborted" or null.
             */
            default:
                return response.error({
                    message: "Method not implemented."
                });
        }
    }
}
