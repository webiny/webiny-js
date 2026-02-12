import { TaskDefinition } from "@webiny/api-core/features/task/TaskDefinition/index.js";
import { ListModelsUseCase } from "@webiny/api-headless-cms/features/contentModel/ListModels/index.js";
import { SYNC_FLP_TASK_ID, UPDATE_FLP_TASK_ID } from "~/flp/tasks/index.js";
import { type ISyncFlpTaskInput, type IUpdateFlpTaskInput } from "~/types.js";
import { FM_FILE_TYPE } from "~/constants.js";
import { GetFolderUseCase } from "~/features/folder/GetFolder/index.js";
import { ListFoldersUseCase } from "~/features/folder/ListFolders/index.js";

class SyncFlpTaskImpl implements TaskDefinition.Interface<ISyncFlpTaskInput> {
    id = SYNC_FLP_TASK_ID;
    title = "ACO - Sync FLP record";
    description = "Synchronizes the FLP catalog by updating the FLP record and its descendants.";
    enableDatabaseLogs = false;

    constructor(
        private getFolder: GetFolderUseCase.Interface,
        private listFolders: ListFoldersUseCase.Interface,
        private listModels: ListModelsUseCase.Interface
    ) {}

    async run({ input, controller }: TaskDefinition.RunParams<ISyncFlpTaskInput>) {
        try {
            if (controller.runtime.isAborted()) {
                return controller.response.aborted();
            }

            /**
             * `folderId` provided in the task input. We need to:
             *
             * - update the FLP records for the found folder and all its descendants.
             */
            if (input.folderId) {
                const result = await this.getFolder.execute(input.folderId!);
                const folder = result.value;

                await controller.task.trigger<IUpdateFlpTaskInput>({
                    definition: UPDATE_FLP_TASK_ID,
                    input: {
                        folder
                    }
                });

                return controller.response.done(
                    `Task completed successfully: all FLP records for folderId "${input.folderId}" and its children have been queued to be synchronized.`
                );
            }

            /**
             *  Full update required. We need to:
             *
             *  - list cms models to collect their types, together with the default ones [FM_FILE_TYPE]
             *  - list all root folders
             *  - update the FLP records for the found folders and all its descendants.
             */
            if (input.type && input.type === "*") {
                // Some folder types are fixed: pages and files.
                const folderTypes = [FM_FILE_TYPE];

                // List all non-private models
                const modelsResult = await this.listModels.execute();
                if (modelsResult.isOk()) {
                    const models = modelsResult.value;
                    for (const model of models) {
                        folderTypes.push(`cms:${model.modelId}`);
                    }
                }

                for (const folderType of folderTypes) {
                    const result = await this.listFolders.execute({
                        where: {
                            type: folderType,
                            parentId: null
                        }
                    });

                    const { folders } = result.value;

                    for (const folder of folders) {
                        await controller.task.trigger<IUpdateFlpTaskInput>({
                            definition: UPDATE_FLP_TASK_ID,
                            input: {
                                folder
                            }
                        });
                    }

                    await controller.logger.info({
                        message: `FLP Update task triggered for type ${folderType}`,
                        data: {
                            type: folderType
                        }
                    });
                }

                return controller.response.done(
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
                const result = await this.listFolders.execute({
                    where: {
                        type: input.type!,
                        parentId: null
                    }
                });

                const { folders } = result.value;

                for (const folder of folders) {
                    await controller.task.trigger<IUpdateFlpTaskInput>({
                        definition: UPDATE_FLP_TASK_ID,
                        input: {
                            folder
                        }
                    });
                }

                return controller.response.done(
                    `Task completed successfully: all FLP records for type "${input.type}" have been queued to be synchronized.`
                );
            }

            return controller.response.error(
                "Invalid input: please provide either `type` or `folderId`."
            );
        } catch (error) {
            return controller.response.error(error);
        }
    }
}

export const SyncFlpTask = TaskDefinition.createImplementation({
    implementation: SyncFlpTaskImpl,
    dependencies: [GetFolderUseCase, ListFoldersUseCase, ListModelsUseCase]
});
