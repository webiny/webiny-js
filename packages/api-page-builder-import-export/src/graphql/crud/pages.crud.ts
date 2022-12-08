import WebinyError from "@webiny/error";
import { NotFoundError } from "@webiny/handler-graphql";
import { ContextPlugin } from "@webiny/api";
import checkBasePermissions from "@webiny/api-page-builder/graphql/crud/utils/checkBasePermissions";
import { PageImportExportTaskStatus, PagesImportExportCrud, PbImportExportContext } from "~/types";
import { invokeHandlerClient } from "~/client";
import { Payload as CreateHandlerPayload } from "~/importPages/create";
import { initialStats } from "~/importPages/utils";
import { Payload as ExportPagesProcessHandlerPayload } from "~/exportPages/process";
import { EXPORT_PAGES_FOLDER_KEY } from "~/exportPages/utils";
import { MetaResponse } from "@webiny/api-page-builder/types";
import { zeroPad } from "@webiny/utils";

const PERMISSION_NAME = "pb.page";
const EXPORT_PAGES_PROCESS_HANDLER = process.env.EXPORT_PAGES_PROCESS_HANDLER as string;
const IMPORT_PAGES_CREATE_HANDLER = process.env.IMPORT_PAGES_CREATE_HANDLER as string;

export default new ContextPlugin<PbImportExportContext>(context => {
    const importExportCrud: PagesImportExportCrud = {
        async importPages({ category: categorySlug, zipFileUrl }) {
            await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "w"
            });

            // Bail out early if category not found
            const category = await context.pageBuilder.getCategory(categorySlug);
            if (!category) {
                throw new NotFoundError(`Category with slug "${categorySlug}" not found.`);
            }

            // Create a task for import page
            const task = await context.pageBuilder.importExportTask.createTask({
                status: PageImportExportTaskStatus.PENDING,
                input: {
                    category: categorySlug,
                    zipFileUrl
                }
            });
            /**
             * Import Pages
             * ImportPages
             * importPages
             */
            await invokeHandlerClient<CreateHandlerPayload>({
                context,
                name: IMPORT_PAGES_CREATE_HANDLER,
                payload: {
                    category: categorySlug,
                    zipFileUrl,
                    task,
                    identity: context.security.getIdentity()
                },
                description: "Import Pages - create"
            });

            return {
                task
            };
        },

        async exportPages({ ids: initialPageIds, revisionType, where, sort, search }) {
            await checkBasePermissions(context, PERMISSION_NAME, {
                rwd: "w"
            });
            let pageIds: string[] = initialPageIds || [];
            // If no ids are provided then it means we want to export all pages
            if (!initialPageIds || (Array.isArray(initialPageIds) && initialPageIds.length === 0)) {
                pageIds = [];
                let pages = [];
                let meta: MetaResponse = {
                    hasMoreItems: true,
                    cursor: null,
                    totalCount: 0
                };
                // Paginate pages
                while (meta.hasMoreItems) {
                    [pages, meta] = await context.pageBuilder.listLatestPages({
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
                throw new WebinyError(
                    "Cannot export pages - no pages found for provided inputs.",
                    "EMPTY_EXPORT_NO_PAGES_FOUND"
                );
            }

            // Create the main task for page export.
            const task = await context.pageBuilder.importExportTask.createTask({
                status: PageImportExportTaskStatus.PENDING
            });
            const exportPagesDataKey = `${EXPORT_PAGES_FOLDER_KEY}/${task.id}`;
            // For each page create a sub task and invoke the process handler.
            for (let i = 0; i < pageIds.length; i++) {
                const pageId = pageIds[i];
                // Create sub task.
                await context.pageBuilder.importExportTask.createSubTask(
                    task.id,
                    zeroPad(i + 1, 5),
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
            await context.pageBuilder.importExportTask.updateTask(task.id, {
                status: PageImportExportTaskStatus.PROCESSING,
                stats: initialStats(pageIds.length),
                input: {
                    exportPagesDataKey,
                    revisionType
                }
            });

            /**
             * Export Pages
             * ExportPages
             * exportPages
             */
            // Invoke handler.
            await invokeHandlerClient<ExportPagesProcessHandlerPayload>({
                context,
                name: EXPORT_PAGES_PROCESS_HANDLER,
                payload: {
                    taskId: task.id,
                    subTaskIndex: 1,
                    identity: context.security.getIdentity()
                },
                description: "Export pages - process"
            });

            return { task };
        }
    };
    // Modify context
    context.pageBuilder.pages = importExportCrud;
});
