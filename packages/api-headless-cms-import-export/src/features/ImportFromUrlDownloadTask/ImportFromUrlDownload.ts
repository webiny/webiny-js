import type {
    IImportFromUrlDownload,
    IImportFromUrlDownloadInput,
    IImportFromUrlDownloadOutput
} from "~/tasks/domain/abstractions/ImportFromUrlDownload.js";
import type { Context } from "~/types.js";
import { createS3Client } from "~/tasks/utils/helpers/s3Client.js";
import { getBucket } from "~/tasks/utils/helpers/getBucket.js";
import type { IMultipartUploadFactoryContinueParams } from "~/tasks/utils/upload/index.js";
import { createMultipartUpload, createMultipartUploadFactory } from "~/tasks/utils/upload/index.js";
import { prependImportPath } from "~/tasks/utils/helpers/importPath.js";
import type { IDownloadFileFromUrlProcessResponseType } from "~/tasks/domain/downloadFileFromUrl/index.js";
import { createDownloadFileFromUrl } from "~/tasks/domain/downloadFileFromUrl/index.js";
import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";

type ProcessType = IDownloadFileFromUrlProcessResponseType<"continue" | "aborted">;

export class ImportFromUrlDownload<
    I extends IImportFromUrlDownloadInput = IImportFromUrlDownloadInput,
    O extends IImportFromUrlDownloadOutput = IImportFromUrlDownloadOutput
> implements IImportFromUrlDownload<Context, I, O>
{
    constructor(private context: Context) {}

    public async run(params: TaskDefinition.RunParams<I, O>) {
        const { input, controller } = params;

        if (!input.modelId) {
            return controller.response.error({
                message: `Missing "modelId" in the input.`,
                code: "MISSING_MODEL_ID"
            });
        } else if (!input.file) {
            return controller.response.error({
                message: `No file found in the provided data.`,
                code: "NO_FILE_FOUND"
            });
        }

        try {
            await this.context.cms.getModel(input.modelId);
        } catch {
            return controller.response.error({
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
                const isClose = controller.runtime.isCloseToTimeout();
                if (isClose) {
                    return stop("continue");
                } else if (controller.runtime.isAborted()) {
                    return stop("aborted");
                }
            });
        } catch (ex) {
            return controller.response.error(ex);
        }

        switch (result) {
            case "aborted":
                await upload.abort();
                return controller.response.aborted();
            case "continue":
                const continueValue: I = {
                    ...input,
                    uploadId: upload.getUploadId(),
                    done: download.isDone(),
                    nextRange: download.getNextRange()
                };
                return controller.response.continue({
                    ...continueValue
                });
            case "done":
                const output: IImportFromUrlDownloadOutput = {
                    file: filename
                };
                return controller.response.done(output as O);
            /**
             * There should be nothing else other than "continue" or "aborted" or null.
             */
            default:
                await upload.abort();
                return controller.response.error({
                    message: `Method not implemented. Result: ${result}`
                });
        }
    }
}
