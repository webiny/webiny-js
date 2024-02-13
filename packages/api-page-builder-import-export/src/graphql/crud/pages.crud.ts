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
    PbExportPagesTaskData,
    PbImportExportContext,
    PbImportPagesTaskData,
    PbImportPagesTaskStats
} from "~/types";
import { PagesPermissions } from "@webiny/api-page-builder/graphql/crud/permissions/PagesPermissions";
import {
    IExportPagesControllerInput,
    IExportPagesControllerOutput,
    IExportPagesZipPagesInput,
    IExportPagesZipPagesOutput,
    PageExportTask
} from "~/export/pages/types";
import {
    IImportPagesControllerInput,
    IImportPagesControllerOutput,
    IImportPagesProcessPagesInput,
    IImportPagesProcessPagesOutput,
    PageImportTask
} from "~/import/pages/types";

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
        /**
         * Background task implementation.
         */
        getExportPagesTask: async id => {
            const task = await context.tasks.getTask<
                IExportPagesControllerInput,
                IExportPagesControllerOutput
            >(id);

            if (!task || task.definitionId !== PageExportTask.Controller) {
                return null;
            }

            const data: PbExportPagesTaskData = {
                url: task.output?.url,
                error: task.output?.error
            };

            const { items: subTasks } = await context.tasks.listTasks<
                IExportPagesZipPagesInput,
                IExportPagesZipPagesOutput
            >({
                where: {
                    parentId: task.id,
                    definitionId: PageExportTask.ZipPages
                },
                limit: 10000
            });

            const stats = {
                queued: [] as string[],
                completed: [] as string[],
                failed: [] as string[]
            };

            for (const subTask of subTasks) {
                if (!subTask.output) {
                    continue;
                }
                const queued = subTask.input.queue || [];
                const completed = Object.keys(subTask.output.done || []);
                const failed = subTask.output.failed || [];

                stats.queued.push(...queued, ...completed, ...failed);
                stats.completed.push(...completed);
                stats.failed.push(...failed);
            }

            return {
                ...task,
                status: task.taskStatus,
                data,
                stats: {
                    total:
                        new Set([...stats.queued, ...stats.completed, ...stats.failed]).size ||
                        task.input.totalPages,
                    completed: stats.completed.length,
                    failed: stats.failed.length
                }
            };
        },
        async getImportPagesTask(id) {
            const task = await context.tasks.getTask<
                IImportPagesControllerInput,
                IImportPagesControllerOutput
            >(id);

            if (!task || task.definitionId !== PageImportTask.Controller) {
                return null;
            }

            const data: PbImportPagesTaskData = {
                error: task.output?.error
            };

            const { items: subTasks } = await context.tasks.listTasks<
                IImportPagesProcessPagesInput,
                IImportPagesProcessPagesOutput
            >({
                where: {
                    parentId: task.id,
                    definitionId: PageImportTask.Process
                },
                limit: 10000
            });

            const stats = subTasks.reduce<PbImportPagesTaskStats>(
                (result, item) => {
                    if (!item.output) {
                        return result;
                    }
                    return {
                        ...result,
                        completed: result.completed + (item.output.done || []).length,
                        failed: result.failed + (item.output.failed || []).length
                    };
                },
                {
                    total: task.output?.total || 0,
                    completed: 0,
                    failed: 0
                }
            );

            return {
                ...task,
                status: task.taskStatus,
                data,
                stats
            };
        },
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
        },
        listImportedPages: async taskId => {
            const task = await context.tasks.getTask<
                IImportPagesControllerInput,
                IImportPagesControllerOutput
            >(taskId);

            if (!task || task.definitionId !== PageImportTask.Controller) {
                throw new NotFoundError(`Task with id "${taskId}" not found.`);
            }
            const { items: subTasks } = await context.tasks.listTasks<
                IImportPagesProcessPagesInput,
                IImportPagesProcessPagesOutput
            >({
                where: {
                    parentId: task.id,
                    definitionId: PageImportTask.Process
                },
                limit: 10000
            });
            const pageIdList = subTasks.reduce<string[]>((collection, subTask) => {
                if (!subTask.output?.pageIdList) {
                    return collection;
                }
                collection.push(...subTask.output.pageIdList);
                return collection;
            }, []);

            const result = await context.pageBuilder.listLatestPages({
                where: {
                    pid_in: pageIdList
                },
                limit: 10000
            });

            const [pages] = result;
            return pages.map(page => {
                return {
                    id: page.id,
                    title: page.title,
                    version: page.version
                };
            });
        }
    };
});
