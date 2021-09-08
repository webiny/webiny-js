import uniqueId from "uniqid";
import { HandlerPlugin } from "@webiny/handler/types";
import { ArgsContext } from "@webiny/handler-args/types";
import { DbContext } from "@webiny/handler-db/types";
import kebabCase from "lodash/kebabCase";
import { extractFilesFromPageData } from "./utils";
import { s3StreamHandler } from "./s3StreamHandler";
import defaults from "~/graphql/crud/utils/defaults";
import { ExportTaskStatus, Page } from "~/types";
import zip2Handler from "./zip2Handler";

export type HandlerArgs = {
    pages: Page[];
    taskId: string;
    PK: string;
};

export type HandlerResponse = {
    data: string;
    error: {
        message: string;
    };
};

/**
 * Handles the export page workflow.
 */
export default (): HandlerPlugin<DbContext, ArgsContext<HandlerArgs>> => ({
    type: "handler",
    async handle(context): Promise<HandlerResponse> {
        try {
            const { invocationArgs: args, db } = context;
            const { pages, taskId, PK } = args;

            const exportInfo = [];
            for (let i = 0; i < pages.length; i++) {
                const page = pages[i];

                // Extract all files
                const files = extractFilesFromPageData(page.content);
                // Filter files
                const filesAvailableForDownload = [];
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    // Check file accessibility
                    if (await s3StreamHandler.isFileAccessible(file.key)) {
                        filesAvailableForDownload.push(file);
                    }
                }

                // Extract the page data in a json file and upload it to S3
                const pageData = {
                    page: {
                        content: page.content
                    },
                    files: filesAvailableForDownload
                };
                const fileBuffer = Buffer.from(JSON.stringify(pageData));
                const pageUploadDataKey = uniqueId("", `-${kebabCase(page.title)}.json`);
                /**
                 * We're not using FileManager storage to upload the file,
                 * because we'll not access it via the FileManager in either API or APP.
                 */
                const pageDataUpload = await s3StreamHandler.upload({
                    Key: pageUploadDataKey,
                    ContentType: "application/json",
                    Body: fileBuffer
                });

                exportInfo.push({
                    pageDataUploadKey: pageDataUpload.Key,
                    files: filesAvailableForDownload,
                    pageTitle: page.title
                });
            }

            const zipHandler = new zip2Handler({
                exportInfo
            });

            const { Location, Key } = await zipHandler.process();

            // Update task record in DB
            const [result] = await db.update({
                ...defaults.db,
                query: { PK, SK: taskId },
                data: {
                    status: ExportTaskStatus.COMPLETED,
                    data: {
                        url: Location,
                        key: Key
                    }
                }
            });

            if (!result) {
                console.warn("Failed to update the task record");
            }
        } catch (e) {
            console.log("Error => ", e);

            /**
             * In case of error, we'll update the task status to "failed",
             * so that, client can show notify the user appropriately.
             */
            const { invocationArgs: args, db } = context;
            const { taskId, PK } = args;
            await db.update({
                ...defaults.db,
                query: { PK, SK: taskId },
                data: {
                    status: ExportTaskStatus.FAILED,
                    data: {
                        error: {
                            name: e.name,
                            message: e.message,
                            stack: e.stack,
                            code: "EXPORT_FAILED"
                        }
                    }
                }
            });

            return {
                data: null,
                error: {
                    message: e.message
                }
            };
        }
    }
});
