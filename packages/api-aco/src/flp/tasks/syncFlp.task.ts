import { createTaskDefinition } from "@webiny/tasks";
import { SYNC_FLP_TASK_ID, UPDATE_FLP_TASK_ID } from "~/flp/tasks/index.js";
import {
    type AcoContext,
    type ISyncFlpTaskInput,
    type ISyncFlpTaskParams,
    type IUpdateFlpTaskInput
} from "~/types.js";
import { PB_PAGE_TYPE, FM_FILE_TYPE } from "~/constants.js";

class SyncFlpTask {
    public init = () => {
        return createTaskDefinition<AcoContext, ISyncFlpTaskInput>({
            id: SYNC_FLP_TASK_ID,
            title: "ACO - Sync FLP record",
            description:
                "Synchronizes the FLP catalog by updating the FLP record and its descendants.",
            disableDatabaseLogs: true,
            run: async (params: ISyncFlpTaskParams) => {
                const { response, isAborted, input, context, store } = params;
                try {
                    if (isAborted()) {
                        return response.aborted();
                    }

                    /**
                     * `folderId` provided in the task input. We need to:
                     *
                     * - update the FLP records for the found folder and all its descendants.
                     */
                    if (input.folderId) {
                        const folder = await context.security.withoutAuthorization(() => {
                            return context.aco.folder.get(input.folderId!);
                        });

                        await context.tasks.trigger<IUpdateFlpTaskInput>({
                            definition: UPDATE_FLP_TASK_ID,
                            input: {
                                folder
                            }
                        });

                        return response.done(
                            `Task completed successfully: all FLP records for folderId "${input.folderId}" and its children have been queued to be synchronized.`
                        );
                    }

                    /**
                     *  Full update required. We need to:
                     *
                     *  - list cms models to collect their types, together with the default ones [PB_PAGE_TYPE, FM_FILE_TYPE]
                     *  - list all root folders
                     *  - update the FLP records for the found folders and all its descendants.
                     */
                    if (input.type && input.type === "*") {
                        // Some folder types are fixed: pages and files.
                        const folderTypes = [PB_PAGE_TYPE, FM_FILE_TYPE];

                        // List all non-private models for the current locale.
                        const models = await context.security.withoutAuthorization(
                            async () => await context.cms.listModels()
                        );

                        for (const model of models) {
                            folderTypes.push(`cms:${model.modelId}`);
                        }

                        for (const folderType of folderTypes) {
                            const [folders] = await context.security.withoutAuthorization(() => {
                                return context.aco.folder.list({
                                    where: {
                                        type: folderType,
                                        parentId: null
                                    }
                                });
                            });

                            for (const folder of folders) {
                                await context.tasks.trigger<IUpdateFlpTaskInput>({
                                    definition: UPDATE_FLP_TASK_ID,
                                    input: {
                                        folder
                                    }
                                });
                            }

                            await store.addInfoLog({
                                message: `FLP Update task triggered for type ${folderType}`,
                                data: {
                                    type: folderType
                                }
                            });
                        }

                        return response.done(
                            `Task completed successfully: all FLP records have been queued to be synchronized.`
                        );
                    }

                    /**
                     * `type` provided in the task input. We need to:
                     *
                     * - list all root folders for the provided type
                     * - update the FLP records for the found folders and all its descendants.
                     */
                    if (input.type) {
                        const [folders] = await context.security.withoutAuthorization(() => {
                            return context.aco.folder.list({
                                where: {
                                    type: input.type!,
                                    parentId: null
                                }
                            });
                        });

                        for (const folder of folders) {
                            await context.tasks.trigger<IUpdateFlpTaskInput>({
                                definition: UPDATE_FLP_TASK_ID,
                                input: {
                                    folder
                                }
                            });
                        }

                        return response.done(
                            `Task completed successfully: all FLP records for type "${input.type}" have been queued to be synchronized.`
                        );
                    }

                    return response.error(
                        "Invalid input: please provide either `type` or `folderId`."
                    );
                } catch (error) {
                    return response.error(error);
                }
            }
        });
    };
}

export const syncFlpTask = () => {
    const task = new SyncFlpTask();
    return task.init();
};
