import WebinyError from "@webiny/error";
import { createTopic } from "@webiny/pubsub";
import { NotFoundError } from "@webiny/handler-graphql";
import { ContextPlugin } from "@webiny/api";
import {
    ExportPagesParams,
    ImportExportTaskStatus,
    OnPagesAfterExportTopicParams,
    OnPagesAfterImportTopicParams,
    OnPagesBeforeExportTopicParams,
    OnPagesBeforeImportTopicParams,
    PagesImportExportCrud,
    PbImportExportContext
} from "~/types";
import { invokeHandlerClient } from "~/client";
import { Payload as CreateHandlerPayload } from "~/import/create";
import { PagesPermissions } from "@webiny/api-page-builder/graphql/crud/permissions/PagesPermissions";
import { IExportPagesControllerInput, PageExportTask } from "~/export/pages/types";

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
            await pagesPermissions.ensure({ rwd: "w" });

            const listPages = (input: ExportPagesParams) => {
                const { revisionType, ...conditions } = input;
                if (revisionType === "published") {
                    return context.pageBuilder.listPublishedPages(conditions);
                }
                return context.pageBuilder.listLatestPages(conditions);
            };
            /**
             * We just need to check if even a single page exists for the provided params.
             * If not, no point in starting a background task.
             */
            const [pages, meta] = await listPages({
                ...params,
                limit: 1
            });
            if (!pages.length || meta.totalCount === 0) {
                throw new WebinyError(
                    "Cannot export pages - no pages found for provided inputs.",
                    "EMPTY_EXPORT_NO_PAGES_FOUND"
                );
            }

            // Create the main task for page export.
            try {
                await onPagesBeforeExport.publish({ params });
                const task = await context.tasks.trigger<IExportPagesControllerInput>({
                    input: {
                        ...params,
                        type: params.revisionType,
                        totalPages: meta.totalCount
                    },
                    definition: PageExportTask.Controller
                });
                await onPagesAfterExport.publish({ params });
                return {
                    task: {
                        id: task.id,
                        status: task.taskStatus,
                        data: {},
                        createdOn: task.createdOn,
                        createdBy: task.createdBy,
                        stats: {
                            total: meta.totalCount,
                            completed: 0,
                            failed: 0
                        }
                    }
                };
            } catch (ex) {
                console.log(ex);
                throw ex;
            }
        }
    };
    // Modify context
    context.pageBuilder.pages = importExportCrud;
});
