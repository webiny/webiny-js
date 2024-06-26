import {
    CmsImportExportObject,
    Context,
    ICmsImportExportObjectAbortExportParams,
    ICmsImportExportObjectGetExportParams,
    ICmsImportExportObjectStartExportParams,
    ICmsImportExportRecord,
    ICmsImportExportTaskOutput,
    ICmsImportExportTaskParams
} from "~/types";
import { convertTaskToCmsImportExportRecord } from "~/crud/utils/importExportRecord";
import { NotFoundError } from "@webiny/handler-graphql";
import { EXPORT_CONTENT_ENTRIES_CONTROLLER_TASK } from "~/tasks";

export const createHeadlessCmsImportExportCrud = async (
    context: Context
): Promise<CmsImportExportObject> => {
    const getExportContentEntries = async (
        params: ICmsImportExportObjectGetExportParams
    ): Promise<ICmsImportExportRecord> => {
        const task = await context.tasks.getTask<
            ICmsImportExportTaskParams,
            ICmsImportExportTaskOutput
        >(params.id);

        if (!task) {
            throw new NotFoundError(
                `Export content entries task with id "${params.id}" not found.`
            );
        }

        return convertTaskToCmsImportExportRecord(task);
    };

    const startExportContentEntries = async (
        params: ICmsImportExportObjectStartExportParams
    ): Promise<ICmsImportExportRecord> => {
        const task = await context.tasks.trigger<ICmsImportExportTaskParams>({
            name: `Export Content Entries and Assets Controller for "${params.modelId}"`,
            input: {
                modelId: params.modelId,
                limit: params.limit
            },
            definition: EXPORT_CONTENT_ENTRIES_CONTROLLER_TASK
        });

        return convertTaskToCmsImportExportRecord(task);
    };

    const abortExportContentEntries = async (
        params: ICmsImportExportObjectAbortExportParams
    ): Promise<ICmsImportExportRecord> => {
        const task = await context.tasks.abort<ICmsImportExportTaskParams>({
            id: params.id
        });
        return convertTaskToCmsImportExportRecord(task);
    };

    return {
        getExportContentEntries,
        startExportContentEntries,
        abortExportContentEntries
    };
};
