import WebinyError from "@webiny/error";
import { createTopic } from "@webiny/pubsub";
import { NotFoundError } from "@webiny/handler-graphql";
import { ContextPlugin } from "@webiny/api";
import {
    ImportExportTaskStatus,
    PagesImportExportCrud,
    PbImportExportContext,
    OnPagesBeforeExportTopicParams,
    OnPagesAfterExportTopicParams,
    OnPagesBeforeImportTopicParams,
    OnPagesAfterImportTopicParams
} from "~/types";
import { invokeHandlerClient } from "~/client";
import { Payload as CreateHandlerPayload } from "~/import/create";
import { initialStats } from "~/import/utils";
import { Payload as ExportPagesProcessHandlerPayload } from "~/export/process";
import { MetaResponse } from "@webiny/api-page-builder/types";
import { zeroPad } from "@webiny/utils";
import { PagesPermissions } from "@webiny/api-page-builder/graphql/crud/permissions/PagesPermissions";

export const EXPORT_PAGES_FOLDER_KEY = "WEBINY_PB_EXPORT_PAGES";
const EXPORT_PAGES_PROCESS_HANDLER = process.env.EXPORT_PROCESS_HANDLER as string;
const IMPORT_PAGES_CREATE_HANDLER = process.env.IMPORT_CREATE_HANDLER as string;

export default new ContextPlugin<PbImportExportContext>(context => {
    const pagesPermissions = new PagesPermissions({
        getPermissions: () => context.security.getPermissions("pb.page"),
        getIdentity: context.security.getIdentity,
        fullAccessPermissionName: "pb.*"
    });

    // Export
    const onPagesBeforeExport = createTopic<OnPagesBeforeExportTopicParams>(
        "PageBuilder.onPagesBeforeExport"
    );
    const onPagesAfterExport = createTopic<OnPagesAfterExportTopicParams>(
        "PageBuilder.onPagesAfterExport"
    );

    // Import
    const onPagesBeforeImport = createTopic<OnPagesBeforeImportTopicParams>(
        "PageBuilder.onPagesBeforeImport"
    );
    const onPagesAfterImport = createTopic<OnPagesAfterImportTopicParams>(
        "PageBuilder.onPagesAfterImport"
    );

    const importExportCrud: PagesImportExportCrud = {
        onPagesBeforeExport,
        onPagesAfterExport,
        onPagesBeforeImport,
        onPagesAfterImport,
        async importPages(params) {
            const { category: categorySlug, zipFileUrl, meta } = params;
            await pagesPermissions.ensure({ rwd: "w" });

            // Bail out early if category not found
            const category = await context.pageBuilder.getCategory(categorySlug);
            if (!category) {
                throw new NotFoundError(`Category with slug "${categorySlug}" not found.`);
            }

            // Create a task for import page
            const task = await context.pageBuilder.importExportTask.createTask({
                status: ImportExportTaskStatus.PENDING,
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
            await onPagesBeforeImport.publish({ params });
            await invokeHandlerClient<CreateHandlerPayload>({
                context,
                name: IMPORT_PAGES_CREATE_HANDLER,
                payload: {
                    category: categorySlug,
                    zipFileUrl,
                    task,
                    type: "page",
                    identity: context.security.getIdentity(),
                    meta
                },
                description: "Import Pages - create"
            });
            await onPagesAfterImport.publish({ params });

            return {
                task
            };
        },

        async exportPages(params) {
            const { ids: initialPageIds, revisionType, where, sort, search } = params;
            await pagesPermissions.ensure({ rwd: "w" });

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
                status: ImportExportTaskStatus.PENDING
            });
            const exportPagesDataKey = `${EXPORT_PAGES_FOLDER_KEY}/${task.id}`;
            // For each page create a sub-task and invoke the process handler.
            for (let i = 0; i < pageIds.length; i++) {
                const pageId = pageIds[i];
                // Create sub-task.
                await context.pageBuilder.importExportTask.createSubTask(
                    task.id,
                    zeroPad(i + 1, 5),
                    {
                        status: ImportExportTaskStatus.PENDING,
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
                status: ImportExportTaskStatus.PROCESSING,
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
            await onPagesBeforeExport.publish({ params });
            // Invoke handler.
            await invokeHandlerClient<ExportPagesProcessHandlerPayload>({
                context,
                name: EXPORT_PAGES_PROCESS_HANDLER,
                payload: {
                    taskId: task.id,
                    subTaskIndex: 1,
                    type: "page",
                    identity: context.security.getIdentity()
                },
                description: "Export pages - process"
            });
            await onPagesAfterExport.publish({ params });

            return { task };
        }
    };
    // Modify context
    context.pageBuilder.pages = importExportCrud;
});
