import type {
    CmsImportExportObject,
    Context,
    ICmsImportExportObjectAbortExportParams,
    ICmsImportExportObjectAbortImportFromUrlParams,
    ICmsImportExportObjectGetExportParams,
    ICmsImportExportObjectGetImportFromUrlParams,
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
    AbortExportContentEntriesUseCase,
    GetExportContentEntriesUseCase,
    GetImportFromUrlUseCase,
    GetValidateImportFromUrlUseCase,
    ImportFromUrlUseCase,
    ListExportContentEntriesUseCase,
    ValidateImportFromUrlIntegrityUseCase,
    ValidateImportFromUrlUseCase
} from "./useCases";
import { NotFoundError } from "@webiny/handler-graphql";
import { ExportContentEntriesUseCase } from "~/crud/useCases/exportContentEntries";
import { UrlSigner } from "~/tasks/utils/urlSigner";
import { getBucket } from "~/tasks/utils/helpers/getBucket";
import { createS3Client } from "~/tasks/utils/helpers/s3Client";
import { AbortImportFromUrlUseCase } from "./useCases/abortImportFromUrl";

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

    const getImportFromUrlUseCase = new GetImportFromUrlUseCase({
        getTask: context.tasks.getTask
    });

    const exportContentEntriesUseCase = new ExportContentEntriesUseCase({
        triggerTask: context.tasks.trigger
    });

    const abortExportContentEntriesUseCase = new AbortExportContentEntriesUseCase({
        abortTask: context.tasks.abort
    });

    const abortImportFromUrlUseCase = new AbortImportFromUrlUseCase({
        getTaskUseCase: getImportFromUrlUseCase,
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

    const getImportFromUrl = async (
        params: ICmsImportExportObjectGetImportFromUrlParams
    ): Promise<ICmsImportExportObjectImportFromUrlResult> => {
        const result = await getImportFromUrlUseCase.execute(params);
        if (!result) {
            throw new NotFoundError(`Import from URL task with id "${params.id}" not found.`);
        }
        return result;
    };

    const abortImportFromUrl = async (
        params: ICmsImportExportObjectAbortImportFromUrlParams
    ): Promise<ICmsImportExportObjectImportFromUrlResult> => {
        return await abortImportFromUrlUseCase.execute(params);
    };

    return {
        getExportContentEntries,
        listExportContentEntries,
        exportContentEntries,
        abortExportContentEntries,
        validateImportFromUrl,
        getValidateImportFromUrl,
        importFromUrl,
        getImportFromUrl,
        abortImportFromUrl
    };
};
