import WebinyError from "@webiny/error";
import { createTopic } from "@webiny/pubsub";
import { ContextPlugin } from "@webiny/api";
import {
    ImportExportTaskStatus,
    BlocksImportExportCrud,
    PbImportExportContext,
    OnBlocksBeforeExportTopicParams,
    OnBlocksAfterExportTopicParams,
    OnBlocksBeforeImportTopicParams,
    OnBlocksAfterImportTopicParams
} from "~/types";
import { invokeHandlerClient } from "~/client";
import { Payload as CreateHandlerPayload } from "~/import/create";
import { initialStats } from "~/import/utils";
import { Payload as ExportBlocksProcessHandlerPayload } from "~/export/process";
import { zeroPad } from "@webiny/utils";
import { PageBlocksPermissions } from "@webiny/api-page-builder/graphql/crud/permissions/PageBlocksPermissions";

const EXPORT_BLOCKS_FOLDER_KEY = "WEBINY_PB_EXPORT_BLOCK";
const EXPORT_BLOCKS_PROCESS_HANDLER = process.env.EXPORT_PROCESS_HANDLER as string;
const IMPORT_BLOCKS_CREATE_HANDLER = process.env.IMPORT_CREATE_HANDLER as string;

export default new ContextPlugin<PbImportExportContext>(context => {
    const pageBlocksPermissions = new PageBlocksPermissions({
        getPermissions: () => context.security.getPermissions("pb.block"),
        getIdentity: context.security.getIdentity,
        fullAccessPermissionName: "pb.*"
    });

    // Export
    const onBlocksBeforeExport = createTopic<OnBlocksBeforeExportTopicParams>(
        "PageBuilder.onBlocksBeforeExport"
    );
    const onBlocksAfterExport = createTopic<OnBlocksAfterExportTopicParams>(
        "PageBuilder.onBlocksAfterExport"
    );

    // Import
    const onBlocksBeforeImport = createTopic<OnBlocksBeforeImportTopicParams>(
        "PageBuilder.onBlocksBeforeImport"
    );
    const onBlocksAfterImport = createTopic<OnBlocksAfterImportTopicParams>(
        "PageBuilder.onBlocksAfterImport"
    );

    const importExportCrud: BlocksImportExportCrud = {
        onBlocksBeforeExport,
        onBlocksAfterExport,
        onBlocksBeforeImport,
        onBlocksAfterImport,
        async importBlocks(params) {
            const { zipFileUrl } = params;
            await pageBlocksPermissions.ensure({ rwd: "w" });

            // Create a task for import block
            const task = await context.pageBuilder.importExportTask.createTask({
                status: ImportExportTaskStatus.PENDING,
                input: {
                    zipFileUrl
                }
            });
            /**
             * Import Blocks
             * ImportBlocks
             * importBlocks
             */
            await onBlocksBeforeImport.publish({ params });
            await invokeHandlerClient<CreateHandlerPayload>({
                context,
                name: IMPORT_BLOCKS_CREATE_HANDLER,
                payload: {
                    zipFileUrl,
                    task,
                    type: "block",
                    identity: context.security.getIdentity()
                },
                description: "Import Blocks - create"
            });
            await onBlocksAfterImport.publish({ params });

            return {
                task
            };
        },

        async exportBlocks(params) {
            const { ids: initialBlockIds, where } = params;
            await pageBlocksPermissions.ensure({ rwd: "w" });

            let blockIds: string[] = initialBlockIds || [];
            // If no ids are provided then it means we want to export all blocks
            if (
                !initialBlockIds ||
                (Array.isArray(initialBlockIds) && initialBlockIds.length === 0)
            ) {
                const blocks = await context.pageBuilder.listPageBlocks({ where });
                // Save block ids
                blockIds = blocks.map(block => block.id);
            }

            if (blockIds.length === 0) {
                throw new WebinyError(
                    "Cannot export blocks - no blocks found for provided inputs.",
                    "EMPTY_EXPORT_NO_BLOCKS_FOUND"
                );
            }

            // Create the main task for blocks export.
            const task = await context.pageBuilder.importExportTask.createTask({
                status: ImportExportTaskStatus.PENDING
            });
            const exportBlocksDataKey = `${EXPORT_BLOCKS_FOLDER_KEY}/${task.id}`;
            // For each block create a sub task and invoke the process handler.
            for (let i = 0; i < blockIds.length; i++) {
                const blockId = blockIds[i];
                // Create sub task.
                await context.pageBuilder.importExportTask.createSubTask(
                    task.id,
                    zeroPad(i + 1, 5),
                    {
                        status: ImportExportTaskStatus.PENDING,
                        input: {
                            blockId,
                            exportBlocksDataKey
                        }
                    }
                );
            }
            // Update main task status.
            await context.pageBuilder.importExportTask.updateTask(task.id, {
                status: ImportExportTaskStatus.PROCESSING,
                stats: initialStats(blockIds.length),
                input: {
                    exportBlocksDataKey
                }
            });

            /**
             * Export Blocks
             * ExportBlocks
             * exportBlocks
             */
            await onBlocksBeforeExport.publish({ params });
            // Invoke handler.
            await invokeHandlerClient<ExportBlocksProcessHandlerPayload>({
                context,
                name: EXPORT_BLOCKS_PROCESS_HANDLER,
                payload: {
                    taskId: task.id,
                    subTaskIndex: 1,
                    type: "block",
                    identity: context.security.getIdentity()
                },
                description: "Export blocks - process"
            });
            await onBlocksAfterExport.publish({ params });

            return { task };
        }
    };
    // Modify context
    context.pageBuilder.blocks = importExportCrud;
});
