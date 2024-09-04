import { ITaskResponseResult, ITaskRunParams } from "@webiny/tasks/types";
import {
    IImportFromUrlContentEntries,
    IImportFromUrlContentEntriesInput,
    IImportFromUrlContentEntriesInputDownloadValues,
    IImportFromUrlContentEntriesOutput
} from "~/tasks/domain/abstractions/ImportFromUrlContentEntries";
import { Context } from "~/types";
import { createS3Client } from "~/tasks/utils/helpers/s3Client";
import { getBucket } from "~/tasks/utils/helpers/getBucket";
import { createMultipartUpload, createMultipartUploadFactory } from "~/tasks/utils/upload";
import { createDownloadFileFromUrl } from "./downloadFileFromUrl/index";
import { convertFromUrlToPathname } from "~/tasks/domain/utils/convertFromUrlToPathname";
import { prependImportPath } from "~/tasks/utils/helpers/importPath";

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
            return response.error("Not implemented. Decompress done...");
        }
        /**
         * If download is done, we can now proceed with the decompress process.
         */
        //
        else if (input.download?.done) {
            return response.error("Not implemented. Download done...");
        }

        const file = convertFromUrlToPathname({
            url: input.file.get,
            size: input.file.size
        });

        const filename = prependImportPath(file.key);
        const uploadFactory = createMultipartUploadFactory({
            client,
            bucket: getBucket(),
            filename,
            createHandler: createMultipartUpload
        });

        const upload = await uploadFactory.start({
            uploadId: input.download?.uploadId
        });

        const download = createDownloadFileFromUrl({
            fetch,
            file,
            nextRange: input.download?.nextRange,
            upload
        });
        let result: ProcessType | "done";
        try {
            result = await download.process<ProcessType>(async ({ stop }) => {
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
                await upload.abort();
                return response.aborted();
            case "continue":
            case null:
                const output: IImportFromUrlContentEntriesInputDownloadValues = {
                    uploadId: upload.getUploadId(),
                    done: download.isDone(),
                    nextRange: download.getNextRange()
                };
                return response.continue({
                    ...input,
                    download: output
                });
            /**
             * There should be nothing else other than "continue" or "aborted" or null.
             */
            default:
                await upload.abort();
                return response.error({
                    message: `Method not implemented. Result: ${result}`
                });
        }
    }
}
