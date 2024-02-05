import WebinyError from "@webiny/error";
import { createTopic } from "@webiny/pubsub";
import { NotFoundError } from "@webiny/handler-graphql";
import { ContextPlugin } from "@webiny/api";
import {
    ExportPagesParams,
    OnPagesAfterExportTopicParams,
    OnPagesAfterImportTopicParams,
    OnPagesBeforeExportTopicParams,
    OnPagesBeforeImportTopicParams,
    PbImportExportContext
} from "~/types";
import { PagesPermissions } from "@webiny/api-page-builder/graphql/crud/permissions/PagesPermissions";
import { IExportPagesControllerInput, PageExportTask } from "~/export/pages/types";
import { IImportPagesControllerInput, PageImportTask } from "~/import/pages/types";

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

    context.pageBuilder.pages = {
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

            const identity = context.security.getIdentity();

            try {
                await onPagesBeforeImport.publish({ params });
                const task = await context.tasks.trigger<IImportPagesControllerInput>({
                    definition: PageImportTask.Controller,
                    input: {
                        category: categorySlug,
                        zipFileUrl,
                        meta,
                        identity: {
                            id: identity.id,
                            displayName: identity.displayName || "unknown",
                            type: identity.type
                        }
                    }
                });
                await onPagesAfterImport.publish({ params });
                return {
                    task: {
                        id: task.id,
                        status: task.taskStatus,
                        data: {},
                        createdOn: task.createdOn,
                        createdBy: task.createdBy,
                        stats: {
                            total: 0,
                            completed: 0,
                            failed: 0
                        }
                    }
                };
            } catch (ex) {
                console.log(ex);
                throw ex;
            }
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
});
