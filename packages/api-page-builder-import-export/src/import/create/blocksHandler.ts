import { ImportExportTaskStatus, PbImportExportContext } from "~/types";
import { initialStats } from "~/import/utils";
import { invokeHandlerClient } from "~/client";
import { Payload as ProcessPayload } from "../process";
import { mockSecurity } from "~/mockSecurity";
import { zeroPad } from "@webiny/utils";
import { Configuration, Payload, Response } from "~/import/create";
import { extractAndUploadZipFileContents } from "~/import/utils/extractAndUploadZipFileContents";

export const blocksHandler = async (
    configuration: Configuration,
    payload: Payload,
    context: PbImportExportContext
): Promise<Response> => {
    const log = console.log;

    const { pageBuilder } = context;
    const { task, type, zipFileUrl, identity } = payload;
    try {
        log("RUNNING Import Blocks Create");
        if (!zipFileUrl) {
            return {
                data: null,
                error: {
                    message: `Missing "zipFileUrl"!`
                }
            };
        }
        mockSecurity(identity, context);
        // Step 1: Read the zip file
        const blockImportDataList = await extractAndUploadZipFileContents(zipFileUrl);

        // For each block create a subtask and invoke the process handler
        for (let i = 0; i < blockImportDataList.length; i++) {
            const blocksDirMap = blockImportDataList[i];
            // Create sub-task
            const subtask = await pageBuilder.importExportTask.createSubTask(
                task.id,
                zeroPad(i + 1, 5),
                {
                    status: ImportExportTaskStatus.PENDING,
                    data: {
                        blockKey: blocksDirMap.key,
                        zipFileUrl,
                        input: {
                            fileUploadsData: blocksDirMap
                        }
                    }
                }
            );
            log(`Added SUB_TASK "${subtask.id}" to queue.`);
        }
        // Update main task status
        await pageBuilder.importExportTask.updateTask(task.id, {
            status: ImportExportTaskStatus.PROCESSING,
            stats: initialStats(blockImportDataList.length)
        });

        await invokeHandlerClient<ProcessPayload>({
            context,
            name: configuration.handlers.process,
            payload: {
                taskId: task.id,
                // Execute "Process" for the first sub-task.
                subTaskIndex: 1,
                type,
                identity: context.security.getIdentity()
            },
            description: "Import blocks - process - first"
        });
    } catch (e) {
        log("[IMPORT_BLOCKS_CREATE] Error => ", e);

        /**
         * In case of error, we'll update the task status to "failed",
         * so that, client can show notify the user appropriately.
         */

        await pageBuilder.importExportTask.updateTask(task.id, {
            status: ImportExportTaskStatus.FAILED,
            error: {
                name: e.name,
                message: e.message,
                code: e.code || "EXPORT_FAILED"
            }
        });

        return {
            data: null,
            error: {
                message: e.message
            }
        };
    }

    return {
        data: "",
        error: null
    };
};
