import { Result } from "@webiny/feature/api";
import { createCacheKey } from "@webiny/utils";
import { GetModelRepository } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { GetLatestRevisionByEntryIdRepository } from "@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import { CreateEntryRepository } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { CreateEntryDataFactory } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { GetWebhookSettingsRepository as RepositoryAbstraction } from "./abstractions.js";
import { WebhookModelNotFoundError, WebhookPersistenceError } from "~/api/domain/errors.js";
import { WEBHOOK_SETTINGS_MODEL_ID } from "~/api/domain/constants.js";
import type { IWebhookSettings } from "~/api/domain/WebhookSettings.js";

interface WebhookSettingsValues {
    signingSecret?: string;
    deliveryRetentionDays?: number;
}

class GetWebhookSettingsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private readonly getModelRepository: GetModelRepository.Interface,
        private readonly getLatestRevisionRepository: GetLatestRevisionByEntryIdRepository.Interface,
        private readonly createEntryRepository: CreateEntryRepository.Interface,
        private readonly createEntryDataFactory: CreateEntryDataFactory.Interface
    ) {}

    async execute(): Promise<Result<IWebhookSettings, RepositoryAbstraction.Error>> {
        try {
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

            if (entryResult.isOk()) {
                return Result.ok({
                    signingSecret: entryResult.value.values.signingSecret,
                    deliveryRetentionDays: entryResult.value.values.deliveryRetentionDays
                });
            }

            /* Entry doesn't exist yet — create it with empty values. */
            const { entry } = await this.createEntryDataFactory.create<WebhookSettingsValues>(
                model,
                { id: singletonId, values: {} as WebhookSettingsValues }
            );

            const createResult = await this.createEntryRepository.execute(model, entry);
            if (createResult.isFail()) {
                return Result.fail(WebhookPersistenceError.from(createResult.error));
            }

            return Result.ok({ signingSecret: undefined, deliveryRetentionDays: undefined });
        } catch (error) {
            return Result.fail(WebhookPersistenceError.from(error));
        }
    }
}

export const GetWebhookSettingsRepository = RepositoryAbstraction.createImplementation({
    implementation: GetWebhookSettingsRepositoryImpl,
    dependencies: [
        GetModelRepository,
        GetLatestRevisionByEntryIdRepository,
        CreateEntryRepository,
        CreateEntryDataFactory
    ]
});
