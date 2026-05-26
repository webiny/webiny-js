import { Result } from "@webiny/feature/api";
import { createCacheKey } from "@webiny/utils";
import { GetModelRepository } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { GetLatestRevisionByEntryIdRepository } from "@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import { UpdateEntryRepository } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { UpdateEntryDataFactory } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { GetBackgroundTaskSettingsRepository } from "~/api/features/GetBackgroundTaskSettings/abstractions.js";
import {
    UpdateBackgroundTaskSettingsRepository as RepositoryAbstraction,
    type IUpdateBackgroundTaskSettingsInput
} from "./abstractions.js";
import {
    BackgroundTaskModelNotFoundError,
    BackgroundTaskPersistenceError
} from "~/api/domain/errors.js";
import { BACKGROUND_TASK_SETTINGS_MODEL_ID } from "~/api/domain/constants.js";
import type { IBackgroundTaskSettings } from "~/api/domain/BackgroundTaskSettings.js";

interface BackgroundTaskSettingsValues {
    retentionDays?: number;
}

class UpdateBackgroundTaskSettingsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private readonly getModelRepository: GetModelRepository.Interface,
        private readonly getSettingsRepository: GetBackgroundTaskSettingsRepository.Interface,
        private readonly getLatestRevisionRepository: GetLatestRevisionByEntryIdRepository.Interface,
        private readonly updateEntryRepository: UpdateEntryRepository.Interface,
        private readonly updateEntryDataFactory: UpdateEntryDataFactory.Interface
    ) {}

    async execute(
        input: IUpdateBackgroundTaskSettingsInput
    ): Promise<Result<IBackgroundTaskSettings, RepositoryAbstraction.Error>> {
        try {
            /* Ensure the singleton entry exists (creates if missing). */
            const getResult = await this.getSettingsRepository.execute();
            if (getResult.isFail()) {
                return getResult;
            }

            const modelResult = await this.getModelRepository.execute(
                BACKGROUND_TASK_SETTINGS_MODEL_ID
            );
            if (modelResult.isFail()) {
                return Result.fail(
                    new BackgroundTaskModelNotFoundError(BACKGROUND_TASK_SETTINGS_MODEL_ID)
                );
            }

            const model = modelResult.value;
            const singletonId = createCacheKey(model.modelId);
            const entryId = `${singletonId}#0001`;

            const entryResult =
                await this.getLatestRevisionRepository.execute<BackgroundTaskSettingsValues>(
                    model,
                    { id: entryId }
                );

            if (entryResult.isFail()) {
                return Result.fail(BackgroundTaskPersistenceError.from(entryResult.error));
            }

            const { entry } =
                await this.updateEntryDataFactory.create<BackgroundTaskSettingsValues>(
                    model,
                    {
                        values: {
                            retentionDays: input.retentionDays
                        }
                    },
                    entryResult.value
                );

            const updateResult = await this.updateEntryRepository.execute(model, entry);
            if (updateResult.isFail()) {
                return Result.fail(BackgroundTaskPersistenceError.from(updateResult.error));
            }

            const settings: IBackgroundTaskSettings = {
                retentionDays: entry.values.retentionDays
            };

            return Result.ok(settings);
        } catch (error) {
            return Result.fail(BackgroundTaskPersistenceError.from(error));
        }
    }
}

export const UpdateBackgroundTaskSettingsRepository = RepositoryAbstraction.createImplementation({
    implementation: UpdateBackgroundTaskSettingsRepositoryImpl,
    dependencies: [
        GetModelRepository,
        GetBackgroundTaskSettingsRepository,
        GetLatestRevisionByEntryIdRepository,
        UpdateEntryRepository,
        UpdateEntryDataFactory
    ]
});
