import {
    CmsImportExportObject,
    Context,
    ICmsImportExportObjectAbortExportParams,
    ICmsImportExportObjectStartExportParams,
    ICmsImportExportRecord,
    ICmsImportExportTaskParams
} from "~/types";
import { convertTaskToCmsImportExportRecord } from "~/crud/importExportRecord";

export const createHeadlessCmsImportExportCrud = async (
    context: Context
): Promise<CmsImportExportObject> => {
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
        startExportContentEntries,
        abortExportContentEntries
    };
};
