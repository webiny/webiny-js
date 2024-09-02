import { ITaskResponseResult, ITaskRunParams } from "@webiny/tasks/types";
import {
    IImportFromUrlDownload,
    IImportFromUrlDownloadInput,
    IImportFromUrlDownloadOutput
} from "~/tasks/domain/abstractions/ImportFromUrlDownload";
import { Context } from "~/types";
import { createS3Client } from "~/tasks/utils/helpers/s3Client";
import { getBucket } from "~/tasks/utils/helpers/getBucket";
import { createMultipartUpload, createMultipartUploadFactory } from "~/tasks/utils/upload";
import {
    createDownloadFileFromUrl,
    IDownloadFileFromUrlProcessResponseType
} from "./downloadFileFromUrl/index";
import { convertFromUrlToPathname } from "~/tasks/domain/utils/convertFromUrlToPathname";
import { EXPORT_BASE_PATH, IMPORT_BASE_PATH } from "~/tasks/constants";

type ProcessType = IDownloadFileFromUrlProcessResponseType<"continue" | "aborted">;

export class ImportFromUrlDownload<
    C extends Context = Context,
    I extends IImportFromUrlDownloadInput = IImportFromUrlDownloadInput,
    O extends IImportFromUrlDownloadOutput = IImportFromUrlDownloadOutput
> implements IImportFromUrlDownload<C, I, O>
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

        const file = convertFromUrlToPathname({
            url: input.file.get,
            size: input.file.size
        });

        const filename = file.key.replace(EXPORT_BASE_PATH, IMPORT_BASE_PATH);
        const uploadFactory = createMultipartUploadFactory({
            client,
            bucket: getBucket(),
            filename,
            createHandler: createMultipartUpload
        });

        console.log("starting download and upload", {
            uploadId: input.uploadId,
            part: input.uploadPart,
            tags: input.tags?.length,
            nextRange: input.nextRange
        });

        const upload = await uploadFactory.start({
            uploadId: input.uploadId,
            tags: input.tags,
            part: input.uploadPart
        });

        const download = createDownloadFileFromUrl({
            fetch,
            file,
            nextRange: input.nextRange,
            upload
        });
        let result: ProcessType;
        try {
            result = await download.process<ProcessType>(async ({ stop }) => {
                const isClose = isCloseToTimeout(60);
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
                const continueValue: I = {
                    ...input,
                    uploadPart: upload.getNextPart(),
                    uploadId: upload.getUploadId(),
                    tags: upload.getTags(),
                    done: download.isDone(),
                    nextRange: download.getNextRange()
                };
                return response.continue({
                    ...continueValue
                });
            case "done":
                const output: IImportFromUrlDownloadOutput = {
                    file: filename
                };
                return response.done(output as O);
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
