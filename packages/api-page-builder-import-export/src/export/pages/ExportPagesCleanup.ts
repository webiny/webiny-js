import {
    IExportPagesCleanupTaskParams,
    IExportPagesControllerOutput,
    IExportPagesZipPagesOutput,
    PageExportTask
} from "~/export/pages/types";
import { ITaskResponseResult } from "@webiny/tasks";
import { createS3Client } from "@webiny/aws-sdk/client-s3";
import lodashChunk from "lodash/chunk";

export class ExportPagesCleanup {
    public async execute(params: IExportPagesCleanupTaskParams): Promise<ITaskResponseResult> {
        const { context, response, store } = params;
        /**
         * This task must have a parent one. If it does not, just end with error.
         * This should not happen as we trigger this task from a parent one, not directly.
         *
         * But let's just make sure.
         */
        const task = store.getTask();
        if (!task.parentId) {
            return response.error(`Missing task "${task.id}" parent id.`);
        }

        const parent = await context.tasks.getTask<IExportPagesControllerOutput>(task.parentId);
        if (!parent) {
            return response.error(`Missing parent task "${task.parentId}" in the database.`);
        }
        /**
         * We need to find all the tasks that created zip files, so we can have a list of files to delete.
         */
        const { items: subTasks } = await context.tasks.listTasks<any, IExportPagesZipPagesOutput>({
            where: {
                parentId: parent.id,
                definitionId: PageExportTask.ZipPages
            },
            limit: 10000
        });
        if (subTasks.length === 0) {
            return response.done("No subtasks found - nothing to cleanup.");
        }

        const files = subTasks.reduce<string[]>((collection, subTask) => {
            const done = subTask.output?.done;
            if (!done) {
                return collection;
            }
            const results = Object.values(done).filter(Boolean);
            collection.push(...results);
            return collection;
        }, []);

        const s3 = createS3Client({
            region: process.env.AWS_REGION
        });

        const parentKey = parent.output?.key;
        if (typeof parentKey === "string") {
            await s3.deleteObject({
                Bucket: process.env.S3_BUCKET,
                Key: parentKey
            });
        }

        const chunks = lodashChunk(files, 500);

        for (const chunk of chunks) {
            await s3.deleteObjects({
                Bucket: process.env.S3_BUCKET,
                Delete: {
                    Objects: chunk.map(Key => ({ Key }))
                }
            });
        }

        return response.done("Done with cleanup!");
    }
}
