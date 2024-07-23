import uniqueId from "uniqid";
import {
    IGetTaskResponse,
    ITaskResponseResult,
    ITaskRunParams,
    TaskDataStatus
} from "@webiny/tasks";
import { CmsImportExportFileType, Context } from "~/types";
import {
    ExportContentEntriesControllerState,
    IExportContentEntriesController,
    IExportContentEntriesControllerInput,
    IExportContentEntriesControllerOutput,
    IExportContentEntriesControllerOutputFile,
    IExportedCmsModel,
    IExportedCmsModelField,
    IExportedCmsModelFieldSettings
} from "~/tasks/domain/abstractions/ExportContentEntriesController";
import { EXPORT_CONTENT_ASSETS_TASK, EXPORT_CONTENT_ENTRIES_TASK } from "~/tasks/constants";
import {
    IExportContentEntriesInput,
    IExportContentEntriesOutput
} from "~/tasks/domain/abstractions/ExportContentEntries";
import {
    IExportContentAssetsInput,
    IExportContentAssetsOutput
} from "~/tasks/domain/abstractions/ExportContentAssets";
import { getBackOffSeconds } from "~/tasks/utils/helpers/getBackOffSeconds";
import { UrlSigner } from "~/tasks/utils/urlSigner";
import { createS3Client } from "~/tasks/utils/helpers/s3Client";
import { getBucket } from "~/tasks/utils/helpers/getBucket";
import { CmsDynamicZoneTemplate, CmsModel, CmsModelField } from "@webiny/api-headless-cms/types";

const prepareExportModelFields = (fields: CmsModelField[]): IExportedCmsModelField[] => {
    return fields.map(field => {
        let settings: IExportedCmsModelFieldSettings | undefined;
        if (Array.isArray(field.settings?.fields)) {
            settings = {
                fields: prepareExportModelFields(field.settings!.fields)
            };
        } else if (Array.isArray(field.settings?.templates)) {
            settings = {
                templates: (field.settings!.templates as CmsDynamicZoneTemplate[]).map(template => {
                    return {
                        id: template.id,
                        gqlTypeName: template.gqlTypeName,
                        fields: prepareExportModelFields(template.fields)
                    };
                })
            };
        } else if (Array.isArray(field.settings?.models)) {
            settings = {
                models: field.settings?.models
            };
        }
        return {
            id: field.id,
            fieldId: field.fieldId,
            type: field.type,
            multipleValues: field.multipleValues,
            settings
        };
    });
};

const prepareExportModel = (model: Pick<CmsModel, "modelId" | "fields">): IExportedCmsModel => {
    return {
        modelId: model.modelId,
        fields: prepareExportModelFields(model.fields)
    };
};

export class ExportContentEntriesController<
    C extends Context = Context,
    I extends IExportContentEntriesControllerInput = IExportContentEntriesControllerInput,
    O extends IExportContentEntriesControllerOutput = IExportContentEntriesControllerOutput
> implements IExportContentEntriesController<C, I, O>
{
    public async run(params: ITaskRunParams<C, I, O>): Promise<ITaskResponseResult<I, O>> {
        const { context, response, input, store, trigger } = params;
        const { state, modelId } = input;

        let model: CmsModel;
        try {
            model = await context.cms.getModel(modelId);
        } catch (ex) {
            return response.error({
                message: `Model "${modelId}" not found.`,
                code: "MODEL_NOT_FOUND"
            });
        }

        const backOffSeconds = getBackOffSeconds(store.getTask().iterations);

        const taskId = store.getTask().id;

        let entriesTask: IGetTaskResponse<IExportContentEntriesInput, IExportContentEntriesOutput>;

        const urlSigner = new UrlSigner({
            client: createS3Client(),
            bucket: getBucket()
        });

        /**
         * In case of no state yet, we will start the content entries export process.
         */
        const prefix = input.prefix || uniqueId(`cms-export/${model.modelId}/${taskId}`);
        if (!state) {
            const task = await trigger<IExportContentEntriesInput>({
                definition: EXPORT_CONTENT_ENTRIES_TASK,
                input: {
                    prefix,
                    exportAssets: input.exportAssets,
                    modelId: model.modelId,
                    limit: input.limit,
                    where: input.where,
                    sort: input.sort,
                    after: undefined
                },
                name: `Export Content Entries ${taskId}`
            });

            return response.continue(
                {
                    ...input,
                    prefix,
                    contentEntriesTaskId: task.id,
                    state: ExportContentEntriesControllerState.entryExport
                },
                {
                    seconds: backOffSeconds
                }
            );
        }
        /**
         * If the state of the task is "entryExport", we need to check if there are any child tasks of the "Export Content Entries" task.
         * If there are, we need to wait for them to finish before we can proceed.
         * If there are no child tasks, we'll return an error.
         * If there are child tasks, but they are not finished, we'll return a "continue" response, which will make the task wait for X seconds before checking again.
         */
        //
        else if (state === ExportContentEntriesControllerState.entryExport) {
            if (!input.contentEntriesTaskId) {
                return response.error({
                    message: `Missing "contentEntriesTaskId" in the input, but the input notes that the task is in "entryExport" state. This should not happen.`,
                    code: "MISSING_CONTENT_ENTRIES_TASK_ID"
                });
            }
            entriesTask = await this.getEntriesTask(context, input.contentEntriesTaskId);
            if (!entriesTask) {
                return response.error({
                    message: `Task "${input.contentEntriesTaskId}" not found.`,
                    code: "TASK_NOT_FOUND"
                });
            }
            if (
                entriesTask.taskStatus == TaskDataStatus.RUNNING ||
                entriesTask.taskStatus === TaskDataStatus.PENDING
            ) {
                return response.continue(input, {
                    seconds: backOffSeconds
                });
            } else if (entriesTask.taskStatus === TaskDataStatus.FAILED) {
                return response.error({
                    message: `Failed to export content entries. Task "${entriesTask.id}" failed.`,
                    code: "EXPORT_ENTRIES_FAILED"
                });
            } else if (entriesTask.taskStatus === TaskDataStatus.ABORTED) {
                return response.error({
                    message: `Export content entries process was aborted. Task "${entriesTask.id}" was aborted.`,
                    code: "EXPORT_ENTRIES_ABORTED"
                });
            } else if (!entriesTask.output) {
                return response.error({
                    message: `No output found on task "${entriesTask.id}". Stopping export process.`,
                    code: "NO_OUTPUT"
                });
            }
            /**
             * Possibly the task does not require any assets to be exported.
             */
            if (!input.exportAssets || entriesTask.output.files.length === 0) {
                return response.done({
                    files: entriesTask.output.files,
                    expiresOn: entriesTask.output.expiresOn || undefined
                } as unknown as O);
            }

            const assetTask = await trigger<IExportContentAssetsInput>({
                definition: EXPORT_CONTENT_ASSETS_TASK,
                input: {
                    prefix,
                    modelId: model.modelId,
                    limit: input.limit,
                    where: input.where,
                    sort: input.sort,
                    entryAfter: undefined,
                    fileAfter: undefined
                },
                name: `Export Content Assets ${taskId}`
            });

            return response.continue(
                {
                    ...input,
                    contentAssetsTaskId: assetTask.id,
                    state: ExportContentEntriesControllerState.assetsExport
                },
                {
                    seconds: backOffSeconds
                }
            );
        }
        /**
         * If the state is "assetsExport", we need to check if there are any child tasks of the "Export Content Assets" task.
         * If there are, we need to wait for them to finish before we can proceed.
         * If there are no child tasks, we'll return as done.
         * If there are child tasks, but they are not finished, we'll return a "continue" response, which will make the task wait for X seconds before checking again.
         */
        //
        else if (state === ExportContentEntriesControllerState.assetsExport) {
            if (!input.contentEntriesTaskId) {
                return response.error({
                    message: `Missing "contentEntriesTaskId" in the input, but the input notes that the task is in "assetsExport" state. This should not happen.`,
                    code: "MISSING_CONTENT_ENTRIES_TASK_ID"
                });
            } else if (!input.contentAssetsTaskId) {
                return response.error({
                    message: `Missing "contentAssetsTaskId" in the input, but the input notes that the task is in "assetsExport" state. This should not happen.`,
                    code: "MISSING_CONTENT_ASSETS_TASK_ID"
                });
            }

            const assetsTask = await this.getAssetsTask(context, input.contentAssetsTaskId);
            if (!assetsTask) {
                return response.error({
                    message: `Task "${input.contentAssetsTaskId}" not found.`,
                    code: "TASK_NOT_FOUND"
                });
            }
            if (
                assetsTask.taskStatus == TaskDataStatus.RUNNING ||
                assetsTask.taskStatus === TaskDataStatus.PENDING
            ) {
                return response.continue(
                    {
                        ...input
                    },
                    {
                        seconds: backOffSeconds
                    }
                );
            } else if (assetsTask.taskStatus === TaskDataStatus.FAILED) {
                return response.error({
                    message: `Failed to export content assets. Task "${assetsTask.id}" failed.`,
                    code: "EXPORT_ASSETS_FAILED"
                });
            } else if (assetsTask.taskStatus === TaskDataStatus.ABORTED) {
                return response.error({
                    message: `Export content assets process was aborted. Task "${assetsTask.id}" was aborted.`,
                    code: "EXPORT_ASSETS_ABORTED"
                });
            }

            entriesTask = await this.getEntriesTask(context, input.contentEntriesTaskId);

            const files: IExportContentEntriesControllerOutputFile[] = [];
            const entriesFiles = entriesTask?.output?.files || [];
            for (const file of entriesFiles) {
                const { url: head } = await urlSigner.head(file);
                const { url: get } = await urlSigner.get(file);
                files.push({
                    head,
                    get,
                    type: CmsImportExportFileType.ENTRIES
                });
            }
            const assetFiles = assetsTask.output?.files || [];
            for (const file of assetFiles) {
                const { url: head } = await urlSigner.head(file);
                const { url: get } = await urlSigner.get(file);
                files.push({
                    head,
                    get,
                    type: CmsImportExportFileType.ASSETS
                });
            }

            return response.done({
                model: prepareExportModel(model),
                files
            } as O);
        }

        return response.error({
            message: `Invalid state "${state}".`,
            code: "INVALID_STATE"
        });
    }

    private async getEntriesTask(context: Context, id: string) {
        try {
            const result = await context.tasks.getTask<
                IExportContentEntriesInput,
                IExportContentEntriesOutput
            >(id);
            if (result?.definitionId === EXPORT_CONTENT_ENTRIES_TASK) {
                return result;
            }
            return null;
        } catch (ex) {
            return null;
        }
    }

    private async getAssetsTask(context: Context, id: string) {
        try {
            const result = await context.tasks.getTask<
                IExportContentAssetsInput,
                IExportContentAssetsOutput
            >(id);
            if (result?.definitionId == EXPORT_CONTENT_ASSETS_TASK) {
                return result;
            }
            return null;
        } catch (ex) {
            return null;
        }
    }
}
