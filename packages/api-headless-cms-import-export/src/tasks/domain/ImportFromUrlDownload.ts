import type { ITaskResponseResult, ITaskRunParams } from "@webiny/tasks/types";
import type {
    IImportFromUrlDownload,
    IImportFromUrlDownloadInput,
    IImportFromUrlDownloadOutput
} from "~/tasks/domain/abstractions/ImportFromUrlDownload";
import type { Context } from "~/types";
import { createS3Client } from "~/tasks/utils/helpers/s3Client";
import { getBucket } from "~/tasks/utils/helpers/getBucket";
import type { IMultipartUploadFactoryContinueParams } from "~/tasks/utils/upload";
import { createMultipartUpload, createMultipartUploadFactory } from "~/tasks/utils/upload";
import { prependImportPath } from "~/tasks/utils/helpers/importPath";
import type { IDownloadFileFromUrlProcessResponseType } from "./downloadFileFromUrl";
import { createDownloadFileFromUrl } from "./downloadFileFromUrl";

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

        const filename = prependImportPath(input.file.key);
        const uploadFactory = createMultipartUploadFactory({
            client,
            bucket: getBucket(),
            filename,
            createHandler: createMultipartUpload
        });

        const uploadParams: IMultipartUploadFactoryContinueParams = {
            uploadId: input.uploadId
        };
        const upload = await uploadFactory.start(uploadParams);

        const download = createDownloadFileFromUrl({
            fetch,
            file: {
                url: input.file.get,
                size: input.file.size,
                key: input.file.key
            },
            nextRange: input.nextRange,
            upload
        });
        let result: ProcessType;
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
                const continueValue: I = {
                    ...input,
                    uploadId: upload.getUploadId(),
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
