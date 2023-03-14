import { ImportExportTaskStatus, PbImportExportContext } from "~/types";
import { initialStats } from "~/import/utils";
import { invokeHandlerClient } from "~/client";
import { Payload as ProcessPayload } from "../process";
import { mockSecurity } from "~/mockSecurity";
import { zeroPad } from "@webiny/utils";
import { Configuration, Payload, Response } from "~/import/create";
import { extractAndUploadZipFileContents } from "~/import/utils/extractAndUploadZipFileContents";

export const formsHandler = async (
    configuration: Configuration,
    payload: Payload,
    context: PbImportExportContext
): Promise<Response> => {
    const log = console.log;

    const { pageBuilder } = context;
    const { task, type, category, zipFileUrl, identity, meta } = payload;
    try {
        log("RUNNING Import Forms Create");
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
        const formImportDataList = await extractAndUploadZipFileContents(zipFileUrl);

        // For each form create a subtask and invoke the process handler
        for (let i = 0; i < formImportDataList.length; i++) {
            const formsDirMap = formImportDataList[i];
            // Create sub-task
            const subtask = await pageBuilder.importExportTask.createSubTask(
                task.id,
                zeroPad(i + 1, 5),
                {
                    status: ImportExportTaskStatus.PENDING,
                    data: {
                        formKey: formsDirMap.key,
                        category,
                        zipFileUrl,
                        meta,
                        input: {
                            fileUploadsData: formsDirMap
                        }
                    }
                }
            );
            log(`Added SUB_TASK "${subtask.id}" to queue.`);
        }
        // Update main task status
        await pageBuilder.importExportTask.updateTask(task.id, {
            status: ImportExportTaskStatus.PROCESSING,
            stats: initialStats(formImportDataList.length)
        });

        await invokeHandlerClient<ProcessPayload>({
            context,
            name: configuration.handlers.process,
            payload: {
                taskId: task.id,
                // Execute "Process" for the first sub task.
                subTaskIndex: 1,
                type,
                identity: context.security.getIdentity()
            },
            description: "Import forms - process - first"
        });
    } catch (e) {
        log("[IMPORT_FORMS_CREATE] Error => ", e);

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
