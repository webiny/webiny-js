import {
    CmsImportExportObject,
    Context,
    ICmsImportExportObjectAbortExportParams,
    ICmsImportExportObjectGetExportParams,
    ICmsImportExportObjectGetValidateImportFromUrlParams,
    ICmsImportExportObjectGetValidateImportFromUrlResult,
    ICmsImportExportObjectImportFromUrlParams,
    ICmsImportExportObjectImportFromUrlResult,
    ICmsImportExportObjectStartExportParams,
    ICmsImportExportObjectValidateImportFromUrlParams,
    ICmsImportExportObjectValidateImportFromUrlResult,
    ICmsImportExportRecord,
    IListExportContentEntriesParams,
    IListExportContentEntriesResult
} from "~/types";
import {
    GetExportContentEntriesUseCase,
    GetValidateImportFromUrlUseCase,
    ValidateImportFromUrlIntegrityUseCase,
    ValidateImportFromUrlUseCase
} from "./useCases";
import { NotFoundError } from "@webiny/handler-graphql";
import { ImportFromUrlUseCase } from "./useCases/importFromUrl/ImportFromUrlUseCase";
import { ExportContentEntriesUseCase } from "~/crud/useCases/exportContentEntries";
import { AbortExportContentEntriesUseCase } from "./useCases/abortExportContentEntries";
import { UrlSigner } from "~/tasks/utils/urlSigner";
import { getBucket } from "~/tasks/utils/helpers/getBucket";
import { createS3Client } from "~/tasks/utils/helpers/s3Client";
import { ListExportContentEntriesUseCase } from "./useCases/listExportContentEntries";

export const createHeadlessCmsImportExportCrud = async (
    context: Context
): Promise<CmsImportExportObject> => {
    const urlSigner = new UrlSigner({
        bucket: getBucket(),
        client: createS3Client()
    });

    const getExportContentEntriesUseCase = new GetExportContentEntriesUseCase({
        getTask: context.tasks.getTask,
        urlSigner
    });

    const listExportContentEntriesUseCase = new ListExportContentEntriesUseCase({
        listTasks: context.tasks.listTasks
    });

    const validateImportFromUrlUseCase = new ValidateImportFromUrlUseCase({
        getModelToAstConverter: context.cms.getModelToAstConverter,
        getModel: context.cms.getModel
    });
    const validateImportFromUrlIntegrityUseCase = new ValidateImportFromUrlIntegrityUseCase({
        triggerTask: context.tasks.trigger
    });
    const getValidateImportFromUrlIntegrityUseCase = new GetValidateImportFromUrlUseCase({
        getTask: context.tasks.getTask
    });

    const importFromUrlUseCase = new ImportFromUrlUseCase({
        updateTask: context.tasks.updateTask,
        getTask: context.tasks.getTask,
        triggerTask: context.tasks.trigger
    });

    const exportContentEntriesUseCase = new ExportContentEntriesUseCase({
        triggerTask: context.tasks.trigger
    });

    const abortExportContentEntriesUseCase = new AbortExportContentEntriesUseCase({
        abortTask: context.tasks.abort
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

    const listExportContentEntries = async (
        params?: IListExportContentEntriesParams
    ): Promise<IListExportContentEntriesResult> => {
        return listExportContentEntriesUseCase.execute(params);
    };

    const exportContentEntries = async (
        params: ICmsImportExportObjectStartExportParams
    ): Promise<ICmsImportExportRecord> => {
        return exportContentEntriesUseCase.execute(params);
    };

    const abortExportContentEntries = async (
        params: ICmsImportExportObjectAbortExportParams
    ): Promise<ICmsImportExportRecord> => {
        return abortExportContentEntriesUseCase.execute(params);
    };

    const validateImportFromUrl = async (
        params: ICmsImportExportObjectValidateImportFromUrlParams
    ): Promise<ICmsImportExportObjectValidateImportFromUrlResult> => {
        const { files, model } = await validateImportFromUrlUseCase.execute({
            data: params.data
        });
        const result = await validateImportFromUrlIntegrityUseCase.execute({
            model,
            files
        });

        return {
            files,
            modelId: model.modelId,
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

    const importFromUrl = async (
        params: ICmsImportExportObjectImportFromUrlParams
    ): Promise<ICmsImportExportObjectImportFromUrlResult> => {
        const result = await importFromUrlUseCase.execute(params);
        if (!result) {
            throw new NotFoundError(`Import from URL task with id "${params.id}" not found.`);
        }
        return result;
    };

    return {
        getExportContentEntries,
        listExportContentEntries,
        exportContentEntries,
        abortExportContentEntries,
        validateImportFromUrl,
        getValidateImportFromUrl,
        importFromUrl
    };
};
