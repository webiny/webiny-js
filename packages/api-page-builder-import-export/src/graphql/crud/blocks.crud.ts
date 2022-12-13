import WebinyError from "@webiny/error";
import { NotFoundError } from "@webiny/handler-graphql";
import { ContextPlugin } from "@webiny/api";
import checkBasePermissions from "@webiny/api-page-builder/graphql/crud/utils/checkBasePermissions";
import { ImportExportTaskStatus, BlocksImportExportCrud, PbImportExportContext } from "~/types";
import { invokeHandlerClient } from "~/client";
import { Payload as CreateHandlerPayload } from "~/importPages/create";
import { initialStats } from "~/importPages/utils";
import { Payload as ExportBlocksProcessHandlerPayload } from "~/exportPages/process";
import { EXPORT_BLOCKS_FOLDER_KEY } from "~/exportPages/utils";
import { zeroPad } from "@webiny/utils";

const PERMISSION_NAME = "pb.block";
const EXPORT_BLOCKS_PROCESS_HANDLER = process.env.EXPORT_PAGES_PROCESS_HANDLER as string;
const IMPORT_BLOCKS_CREATE_HANDLER = process.env.IMPORT_PAGES_CREATE_HANDLER as string;

export default new ContextPlugin<PbImportExportContext>(context => {
    const importExportCrud: BlocksImportExportCrud = {
        async importBlocks({ category: categorySlug, zipFileUrl }) {
            await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "w"
            });

            // Bail out early if category not found
            const category = await context.pageBuilder.getCategory(categorySlug);
            if (!category) {
                throw new NotFoundError(`Category with slug "${categorySlug}" not found.`);
            }

            // Create a task for import block
            const task = await context.pageBuilder.importExportTask.createTask({
                status: ImportExportTaskStatus.PENDING,
                input: {
                    category: categorySlug,
                    zipFileUrl
                }
            });
            /**
             * Import Blocks
             * ImportBlocks
             * importBlocks
             */
            await invokeHandlerClient<CreateHandlerPayload>({
                context,
                name: IMPORT_BLOCKS_CREATE_HANDLER,
                payload: {
                    category: categorySlug,
                    zipFileUrl,
                    task,
                    type: "block",
                    identity: context.security.getIdentity()
                },
                description: "Import Blocks - create"
            });

            return {
                task
            };
        },

        async exportBlocks({ ids: initialBlockIds, where }) {
            await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "w"
            });
            let blockIds: string[] = initialBlockIds || [];
            // If no ids are provided then it means we want to export all blocks
            if (
                !initialBlockIds ||
                (Array.isArray(initialBlockIds) && initialBlockIds.length === 0)
            ) {
                blockIds = [];
                const blocks = await context.pageBuilder.listPageBlocks({ where });
                // Save block ids
                blocks.forEach(block => blockIds.push(block.id));
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

            return { task };
        }
    };
    // Modify context
    context.pageBuilder.blocks = importExportCrud;
});
