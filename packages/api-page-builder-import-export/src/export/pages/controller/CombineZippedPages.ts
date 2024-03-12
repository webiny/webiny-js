import { IExportPagesCombineZippedPagesParams } from "~/export/pages/types";
import { ITaskResponseResult } from "@webiny/tasks";
import { ListObjectsOutput, s3Stream } from "~/export/s3Stream";
import { createExportPagesDataKey } from "~/export/pages/utils";
import { ZipFiles } from "~/utils/ZipFiles";
import uniqueId from "uniqid";

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

        let listObjectResponse: ListObjectsOutput;
        try {
            listObjectResponse = await s3Stream.listObject(exportPagesDataKey);
            if (!Array.isArray(listObjectResponse.Contents)) {
                return response.error({
                    message: "There is no Contents defined on S3 Stream while combining pages."
                });
            } else if (listObjectResponse.Contents.length === 0) {
                return response.done("No zip files to combine.");
            }
        } catch (ex) {
            return response.error(ex);
        }

        const zipFileKeys = listObjectResponse.Contents.reduce<string[]>((files, file) => {
            if (!file.Key) {
                return files;
            } else if (file.Key === exportPagesDataKey) {
                return files;
            }
            files.push(file.Key);

            return files;
        }, []);

        let key: string;

        try {
            const zipOfZip = new ZipFiles();
            const target = uniqueId("EXPORTS/", "-WEBINY_PAGE_EXPORT.zip");
            const pageExportUpload = await zipOfZip.process(target, zipFileKeys);

            if (!pageExportUpload?.Key) {
                return response.error({
                    message: "There is no Key defined on pageExportUpload."
                });
            }
            key = pageExportUpload.Key;
        } catch (ex) {
            console.error(`Error while combining zip files into a single zip: ${ex.message}`);
            console.log(ex);
            return response.error(ex);
        }

        const url = await s3Stream.getPresignedUrl(key);

        return response.done("Done combining pages.", {
            key,
            url
        });
    }
}
