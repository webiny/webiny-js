import { HandlerPlugin } from "@webiny/handler/types";
import { ArgsContext } from "@webiny/handler-args/types";
import { DbContext } from "@webiny/handler-db/types";
import kebabCase from "lodash/kebabCase";
import { extractFilesFromPageData } from "./utils";
import ZipHandler from "./zipHandler";
import { s3StreamHandler } from "./s3StreamHandler";
import defaults from "~/graphql/crud/utils/defaults";
import { ExportTaskStatus } from "~/types";
import mdbid from "mdbid";

export type HandlerArgs = {
    page: any;
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
            const { page, taskId, PK } = args;

            // Extract all files
            const files = extractFilesFromPageData(page.content);

            // Extract the page data in a json file and upload it to S3
            const file = {
                page: {
                    content: page.content
                },
                files
            };
            const fileBuffer = Buffer.from(JSON.stringify(file));
            const uniqueId = mdbid();
            /**
             * FIXME: Maybe this doesn't have to be in File Manager.
             * Why? Because we'll not access it via the FileManager in either API or APP.
             */
            const pageDataUpload = await s3StreamHandler.upload({
                Key: `${uniqueId}-${kebabCase(page.title)}.json`,
                ContentType: "application/json",
                Body: fileBuffer
            });

            // TODO: Improve signature
            // Prepare zip and upload it to S3
            const zipHandler = new ZipHandler({
                files,
                archiveFileName: `${uniqueId}-export-${kebabCase(page.title)}.zip`,
                archiveFormat: "zip",
                s3FileKey: pageDataUpload.Key,
                filesDirName: "assets"
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
            return {
                data: null,
                error: {
                    message: e.message
                }
            };
        }
    }
});
