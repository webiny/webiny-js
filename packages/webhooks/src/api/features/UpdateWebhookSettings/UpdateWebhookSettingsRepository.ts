import { Result } from "@webiny/feature/api";
import { createCacheKey } from "@webiny/utils";
import { GetModelRepository } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { GetLatestRevisionByEntryIdRepository } from "@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import { UpdateEntryRepository } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { UpdateEntryDataFactory } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { GetWebhookSettingsRepository } from "~/api/features/GetWebhookSettings/abstractions.js";
import {
    UpdateWebhookSettingsRepository as RepositoryAbstraction,
    type IUpdateWebhookSettingsInput
} from "./abstractions.js";
import { WebhookModelNotFoundError, WebhookPersistenceError } from "~/api/domain/errors.js";
import { WEBHOOK_SETTINGS_MODEL_ID } from "~/api/domain/constants.js";
import type { IWebhookSettings } from "~/api/domain/WebhookSettings.js";

interface WebhookSettingsValues {
    signingSecret?: string;
}

class UpdateWebhookSettingsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private readonly getModelRepository: GetModelRepository.Interface,
        private readonly getWebhookSettingsRepository: GetWebhookSettingsRepository.Interface,
        private readonly getLatestRevisionRepository: GetLatestRevisionByEntryIdRepository.Interface,
        private readonly updateEntryRepository: UpdateEntryRepository.Interface,
        private readonly updateEntryDataFactory: UpdateEntryDataFactory.Interface
    ) {}

    async execute(
        input: IUpdateWebhookSettingsInput
    ): Promise<Result<IWebhookSettings, RepositoryAbstraction.Error>> {
        try {
            /* Ensure the singleton entry exists (creates if missing). */
            const getResult = await this.getWebhookSettingsRepository.execute();
            if (getResult.isFail()) {
                return getResult;
            }

            const modelResult = await this.getModelRepository.execute(WEBHOOK_SETTINGS_MODEL_ID);
            if (modelResult.isFail()) {
                return Result.fail(new WebhookModelNotFoundError(WEBHOOK_SETTINGS_MODEL_ID));
            }

            const model = modelResult.value;
            const singletonId = createCacheKey(model.modelId);
            const entryId = `${singletonId}#0001`;

            const entryResult =
                await this.getLatestRevisionRepository.execute<WebhookSettingsValues>(model, {
                    id: entryId
                });

            if (entryResult.isFail()) {
                return Result.fail(WebhookPersistenceError.from(entryResult.error));
            }

            const { entry } = await this.updateEntryDataFactory.create<WebhookSettingsValues>(
                model,
                { values: { signingSecret: input.signingSecret } },
                entryResult.value
            );

            const updateResult = await this.updateEntryRepository.execute(model, entry);
            if (updateResult.isFail()) {
                return Result.fail(WebhookPersistenceError.from(updateResult.error));
            }

            const settings: IWebhookSettings = {
                signingSecret: entry.values.signingSecret
            };

            return Result.ok(settings);
        } catch (error) {
            return Result.fail(WebhookPersistenceError.from(error));
        }
    }
}

export const UpdateWebhookSettingsRepository = RepositoryAbstraction.createImplementation({
    implementation: UpdateWebhookSettingsRepositoryImpl,
    dependencies: [
        GetModelRepository,
        GetWebhookSettingsRepository,
        GetLatestRevisionByEntryIdRepository,
        UpdateEntryRepository,
        UpdateEntryDataFactory
    ]
});
