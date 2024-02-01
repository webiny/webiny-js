import { IExportPagesCombineZippedPagesParams } from "~/export/pages/types";
import { ITaskResponseResult } from "@webiny/tasks";
import { s3Stream } from "~/export/s3Stream";
import { createExportPagesDataKey } from "~/export/pages/utils";
import { ZipOfZip } from "~/export/zipper";

export class CombineZippedPages {
    public async execute(
        params: IExportPagesCombineZippedPagesParams
    ): Promise<ITaskResponseResult> {
        const { response, store } = params;
        /**
         * We need to get all the subtasks of the PageExportTask.ZipPages type, so we can get all the zip files and combine them into one.
         * Current task must have a parent for this to work.
         */
        const taskId = store.getTask().id;

        /**
         * When we have all the pages IDs and their zip files, we can continue to combine the zip files into one.
         */
        const exportPagesDataKey = createExportPagesDataKey(taskId);

        const listObjectResponse = await s3Stream.listObject(exportPagesDataKey);
        if (!Array.isArray(listObjectResponse.Contents)) {
            return response.error({
                message: "There is no Contents defined on S3 Stream while combining pages."
            });
        } else if (listObjectResponse.Contents.length === 0) {
            return response.done("No zip files to combine.");
        }

        const zipFileKeys = listObjectResponse.Contents.reduce<string[]>((files, file) => {
            if (!file.Key) {
                return files;
            }
            /**
             * Not sure why this is checked in the current code: https://github.com/webiny/webiny-js/blob/95158786250e01ef65dbde67a29b2dc81062eacd/packages/api-page-builder-import-export/src/export/combine/pagesHandler.ts#L47
             * Let's leave the check for now.
             * TODO: determine if this check is required
             */
            //
            else if (file.Key === exportPagesDataKey) {
                return files;
            }
            files.push(file.Key);

            return files;
        }, []);

        const zipOfZip = new ZipOfZip(zipFileKeys, "WEBINY_PAGE_EXPORT.zip");
        const pageExportUpload = await zipOfZip.process();

        if (!pageExportUpload.Key) {
            return response.error({
                message: "There is no Key defined on pageExportUpload."
            });
        }

        const url = await s3Stream.getPresignedUrl(pageExportUpload.Key);

        return response.done("Done combining pages.", {
            key: pageExportUpload.Key,
            url
        });
    }
}
