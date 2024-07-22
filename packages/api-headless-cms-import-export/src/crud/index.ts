import {
    CmsImportExportObject,
    Context,
    ICmsImportExportObjectAbortExportParams,
    ICmsImportExportObjectGetExportParams,
    ICmsImportExportObjectGetValidateImportFromUrlParams,
    ICmsImportExportObjectGetValidateImportFromUrlResult,
    ICmsImportExportObjectStartExportParams,
    ICmsImportExportObjectValidateImportFromUrlParams,
    ICmsImportExportObjectValidateImportFromUrlResult,
    ICmsImportExportRecord
} from "~/types";
import { convertTaskToCmsImportExportRecord } from "~/crud/utils/importExportRecord";
import { EXPORT_CONTENT_ENTRIES_CONTROLLER_TASK } from "~/tasks/constants";
import {
    IExportContentEntriesControllerInput,
    IExportContentEntriesControllerOutput
} from "~/tasks/domain/abstractions/ExportContentEntriesController";
import {
    GetExportContentEntriesUseCase,
    GetValidateImportFromUrlUseCase,
    ValidateImportFromUrlIntegrityUseCase,
    ValidateImportFromUrlUseCase
} from "./useCases";
import { NotFoundError } from "@webiny/handler-graphql";

export const createHeadlessCmsImportExportCrud = async (
    context: Context
): Promise<CmsImportExportObject> => {
    const getExportContentEntriesUseCase = new GetExportContentEntriesUseCase({
        getTask: context.tasks.getTask
    });

    const validateImportFromUrlUseCase = new ValidateImportFromUrlUseCase();
    const validateImportFromUrlIntegrityUseCase = new ValidateImportFromUrlIntegrityUseCase({
        triggerTask: context.tasks.trigger
    });
    const getValidateImportFromUrlIntegrityUseCase = new GetValidateImportFromUrlUseCase({
        getTask: context.tasks.getTask
    });

    const getExportContentEntries = async (
        params: ICmsImportExportObjectGetExportParams
    ): Promise<ICmsImportExportRecord> => {
        const result = await getExportContentEntriesUseCase.execute(params);
        if (!result) {
            throw new NotFoundError(
                `Export content entries task with id "${params.id}" not found.`
            );
        }
        return result;
    };

    const exportContentEntries = async (
        params: ICmsImportExportObjectStartExportParams
    ): Promise<ICmsImportExportRecord> => {
        const task = await context.tasks.trigger<
            IExportContentEntriesControllerInput,
            IExportContentEntriesControllerOutput
        >({
            name: `Export Content Entries and Assets Controller for "${params.modelId}"`,
            input: {
                modelId: params.modelId,
                exportAssets: params.exportAssets,
                limit: params.limit
            },
            definition: EXPORT_CONTENT_ENTRIES_CONTROLLER_TASK
        });

        return convertTaskToCmsImportExportRecord(task);
    };

    const abortExportContentEntries = async (
        params: ICmsImportExportObjectAbortExportParams
    ): Promise<ICmsImportExportRecord> => {
        const task = await context.tasks.abort<
            IExportContentEntriesControllerInput,
            IExportContentEntriesControllerOutput
        >({
            id: params.id
        });
        return convertTaskToCmsImportExportRecord(task);
    };

    const validateImportFromUrl = async (
        params: ICmsImportExportObjectValidateImportFromUrlParams
    ): Promise<ICmsImportExportObjectValidateImportFromUrlResult> => {
        const { files } = await validateImportFromUrlUseCase.execute({
            data: params.data
        });
        const result = await validateImportFromUrlIntegrityUseCase.execute({
            files
        });

        return {
            files,
            ...result
        };
    };

    const getValidateImportFromUrl = async (
        params: ICmsImportExportObjectGetValidateImportFromUrlParams
    ): Promise<ICmsImportExportObjectGetValidateImportFromUrlResult> => {
        const result = await getValidateImportFromUrlIntegrityUseCase.execute(params);
        if (!result) {
            throw new NotFoundError(
                `Validate import from URL task with id "${params.id}" not found.`
            );
        }
        return result;
    };

    return {
        getExportContentEntries,
        exportContentEntries,
        abortExportContentEntries,
        validateImportFromUrl,
        getValidateImportFromUrl
    };
};
