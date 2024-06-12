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
import { convertTaskToCmsImportExportRecord } from "~/crud/importExportRecord";
import { NotFoundError } from "@webiny/handler-graphql";

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
            name: `Exporting content entries of model "${params.modelId}"`,
            input: {
                modelId: params.modelId
            },
            definition: "exportContentEntries"
        });

        return convertTaskToCmsImportExportRecord(task);
    };

    const abortExportContentEntries = async (
        params: ICmsImportExportObjectAbortExportParams
    ): Promise<void> => {
        await context.tasks.abort({
            id: params.id
        });
    };

    return {
        getExportContentEntries,
        startExportContentEntries,
        abortExportContentEntries
    };
};
