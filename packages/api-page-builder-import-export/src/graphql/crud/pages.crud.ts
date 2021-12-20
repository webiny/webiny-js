import Error from "@webiny/error";
import { NotFoundError } from "@webiny/handler-graphql";
import { ContextPlugin } from "@webiny/handler/plugins/ContextPlugin";
import checkBasePermissions from "@webiny/api-page-builder/graphql/crud/utils/checkBasePermissions";
import {
    PageImportExportTaskStatus,
    PagesImportExportCrud,
    PbPageImportExportContext
} from "~/types";
import { invokeHandlerClient } from "~/importPages/client";
import { HandlerArgs as CreateHandlerArgs } from "~/importPages/create";
import { initialStats, zeroPad } from "~/importPages/utils";
import { HandlerArgs as ExportPagesProcessHandlerArgs } from "~/exportPages/process";
import { EXPORT_PAGES_FOLDER_KEY } from "~/exportPages/utils";

const PERMISSION_NAME = "pb.page";
const EXPORT_PAGES_PROCESS_HANDLER = process.env.EXPORT_PAGES_PROCESS_HANDLER;
const IMPORT_PAGES_CREATE_HANDLER = process.env.IMPORT_PAGES_CREATE_HANDLER;

export default new ContextPlugin<PbPageImportExportContext>(context => {
    const importExportCrud: PagesImportExportCrud = {
        async importPages({ category: categorySlug, zipFileKey, zipFileUrl }) {
            await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "w"
            });

            // Bail out early if category not found
            const category = await context.pageBuilder.getCategory(categorySlug);
            if (!category) {
                throw new NotFoundError(`Category with slug "${categorySlug}" not found.`);
            }

            // Create a task for import page
            const task = await context.pageBuilder.pageImportExportTask.createTask({
                status: PageImportExportTaskStatus.PENDING,
                input: {
                    category: categorySlug,
                    zipFileKey,
                    zipFileUrl
                }
            });

            await invokeHandlerClient<CreateHandlerArgs>({
                context,
                name: IMPORT_PAGES_CREATE_HANDLER,
                payload: {
                    category: categorySlug,
                    zipFileKey,
                    zipFileUrl,
                    task,
                    identity: context.security.getIdentity()
                }
            });

            return {
                task
            };
        },

        async exportPages({ ids: initialPageIds, revisionType, where, sort, search }) {
            await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "w"
            });
            let pageIds = initialPageIds;
            // If no ids are provided then it means we want to export all pages
            if (!initialPageIds || (Array.isArray(initialPageIds) && initialPageIds.length === 0)) {
                pageIds = [];
                let pages = [];
                let meta = { hasMoreItems: true, cursor: null };
                // Paginate pages
                while (meta.hasMoreItems) {
                    [pages, meta] = await context.pageBuilder.pages.listLatestPages({
                        after: meta.cursor,
                        where: where,
                        sort: sort,
                        search: search
                    });
                    // Save page ids
                    pages.forEach(page => pageIds.push(page.id));
                }
            }

            if (pageIds.length === 0) {
                throw new Error(
                    "Cannot export pages - no pages found for provided inputs.",
                    "EMPTY_EXPORT_NO_PAGES_FOUND"
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
                    subTaskIndex: 1,
                    identity: context.security.getIdentity()
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
