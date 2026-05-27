import { Result } from "@webiny/feature/api";
import { createCacheKey } from "@webiny/utils";
import { GetModelRepository } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { GetLatestRevisionByEntryIdRepository } from "@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import { CreateEntryRepository } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { CreateEntryDataFactory } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { BuildParams } from "@webiny/api-core/features/buildParams/index.js";
import { GetBackgroundTaskSettingsRepository as RepositoryAbstraction } from "./abstractions.js";
import {
    BackgroundTaskModelNotFoundError,
    BackgroundTaskPersistenceError
} from "~/api/domain/errors.js";
import {
    BACKGROUND_TASK_SETTINGS_MODEL_ID,
    BACKGROUND_TASK_DEFAULT_RETENTION_DAYS
} from "~/api/domain/constants.js";
import type { IBackgroundTaskSettings } from "~/api/domain/BackgroundTaskSettings.js";

interface BackgroundTaskSettingsValues {
    retentionDays?: number;
}

class GetBackgroundTaskSettingsRepositoryImpl implements RepositoryAbstraction.Interface {
    private readonly defaultRetentionDays: number;

    constructor(
        private readonly getModelRepository: GetModelRepository.Interface,
        private readonly getLatestRevisionRepository: GetLatestRevisionByEntryIdRepository.Interface,
        private readonly createEntryRepository: CreateEntryRepository.Interface,
        private readonly createEntryDataFactory: CreateEntryDataFactory.Interface,
        buildParams: BuildParams.Interface
    ) {
        this.defaultRetentionDays =
            buildParams.get<number>("BackgroundTasks.RetentionDays") ??
            BACKGROUND_TASK_DEFAULT_RETENTION_DAYS;
    }

    async execute(): Promise<Result<IBackgroundTaskSettings, RepositoryAbstraction.Error>> {
        try {
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

            if (entryResult.isOk()) {
                return Result.ok({
                    retentionDays:
                        entryResult.value.values.retentionDays ?? this.defaultRetentionDays
                });
            }

            /* Entry doesn't exist yet — create it with the build-param default. */
            const { entry } =
                await this.createEntryDataFactory.create<BackgroundTaskSettingsValues>(model, {
                    id: singletonId,
                    values: {
                        retentionDays: this.defaultRetentionDays
                    }
                });

            const createResult = await this.createEntryRepository.execute(model, entry);
            if (createResult.isFail()) {
                return Result.fail(BackgroundTaskPersistenceError.from(createResult.error));
            }

            return Result.ok({ retentionDays: this.defaultRetentionDays });
        } catch (error) {
            return Result.fail(BackgroundTaskPersistenceError.from(error));
        }
    }
}

export const GetBackgroundTaskSettingsRepository = RepositoryAbstraction.createImplementation({
    implementation: GetBackgroundTaskSettingsRepositoryImpl,
    dependencies: [
        GetModelRepository,
        GetLatestRevisionByEntryIdRepository,
        CreateEntryRepository,
        CreateEntryDataFactory,
        BuildParams
    ]
});
