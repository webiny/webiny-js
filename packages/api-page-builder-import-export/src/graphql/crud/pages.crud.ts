import Error from "@webiny/error";
import { NotFoundError } from "@webiny/handler-graphql";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import checkBasePermissions from "@webiny/api-page-builder/graphql/crud/utils/checkBasePermissions";
import { PageImportExportTaskStatus, PbPageImportExportContext } from "~/types";
import { invokeHandlerClient } from "~/importPages/client";
import { HandlerArgs as CreateHandlerArgs } from "~/importPages/create";
import { initialStats, zeroPad } from "~/importPages/utils";
import { HandlerArgs as ExportPagesProcessHandlerArgs } from "~/exportPages/process";
import { EXPORT_PAGES_FOLDER_KEY } from "~/exportPages/utils";

const PERMISSION_NAME = "pb.page";
const EXPORT_PAGES_PROCESS_HANDLER = process.env.EXPORT_PAGES_PROCESS_HANDLER;
const IMPORT_PAGES_CREATE_HANDLER = process.env.IMPORT_PAGES_CREATE_HANDLER;

export default new ContextPlugin<PbPageImportExportContext>(context => {
    const importExportCrud = {
        async importPages(
            categorySlug: string,
            data: {
                zipFileKey?: string;
                zipFileUrl?: string;
            }
        ) {
            await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "w"
            });

            // Bail out early if category not found
            const category = await context.pageBuilder.categories.get(categorySlug);
            if (!category) {
                throw new NotFoundError(`Category with slug "${categorySlug}" not found.`);
            }

            // Create a task for import page
            const task = await context.pageBuilder.pageImportExportTask.createTask({
                status: PageImportExportTaskStatus.PENDING,
                input: {
                    category: categorySlug,
                    data
                }
            });

            await invokeHandlerClient<CreateHandlerArgs>({
                context,
                name: IMPORT_PAGES_CREATE_HANDLER,
                payload: {
                    category: categorySlug,
                    data,
                    task
                }
            });

            return {
                task
            };
        },

        async exportPages(pageIds: string[], revisionType) {
            await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "w"
            });
            if (pageIds.length === 0) {
                throw new Error(
                    "Cannot export page(s) - no page ID(s) were provided.",
                    "EMPTY_PAGE_IDS_PROVIDED"
                );
            }

            // Create the main task for page export.
            const task = await context.pageBuilder.pageImportExportTask.createTask({
                status: PageImportExportTaskStatus.PENDING
            });
            const exportPagesDataKey = `${EXPORT_PAGES_FOLDER_KEY}/${task.id}`;
            // For each page create a sub task and invoke the process handler.
            for (let i = 0; i < pageIds.length; i++) {
                const pageId = pageIds[i];
                // Create sub task.
                await context.pageBuilder.pageImportExportTask.createSubTask(
                    task.id,
                    zeroPad(i + 1),
                    {
                        status: PageImportExportTaskStatus.PENDING,
                        input: {
                            pageId,
                            exportPagesDataKey,
                            revisionType
                        }
                    }
                );
            }
            // Update main task status.
            await context.pageBuilder.pageImportExportTask.updateTask(task.id, {
                status: PageImportExportTaskStatus.PROCESSING,
                stats: initialStats(pageIds.length),
                input: {
                    exportPagesDataKey,
                    revisionType
                }
            });

            // Invoke handler.
            await invokeHandlerClient<ExportPagesProcessHandlerArgs>({
                context,
                name: EXPORT_PAGES_PROCESS_HANDLER,
                payload: {
                    taskId: task.id,
                    subTaskIndex: 1
                }
            });

            return { task };
        }
    };
    // Modify context
    context.pageBuilder.pages = {
        ...context.pageBuilder.pages,
        ...importExportCrud
    };
});
