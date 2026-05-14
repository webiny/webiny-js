import { Result } from "@webiny/feature/api";
import { GetModelRepository } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { GetLatestRevisionByEntryIdRepository } from "@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import { UpdateEntryRepository } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { UpdateEntryDataFactory } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { WebhookTransformer } from "~/api/features/Transformers/abstractions/WebhookTransformer.js";
import { UpdateWebhookRepository as RepositoryAbstraction } from "./abstractions.js";
import { WebhookModelNotFoundError, WebhookPersistenceError } from "~/api/domain/errors.js";
import { WEBHOOK_MODEL_ID } from "~/api/domain/constants.js";
import type { Webhook, WebhookCmsEntryValues } from "~/api/domain/Webhook.js";

class UpdateWebhookRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private readonly getModelRepository: GetModelRepository.Interface,
        private readonly getLatestRevisionRepository: GetLatestRevisionByEntryIdRepository.Interface,
        private readonly updateEntryDataFactory: UpdateEntryDataFactory.Interface,
        private readonly updateEntryRepository: UpdateEntryRepository.Interface,
        private readonly transformer: WebhookTransformer.Interface
    ) {}

    async execute(webhook: Webhook): Promise<Result<Webhook, RepositoryAbstraction.Error>> {
        try {
            const modelResult = await this.getModelRepository.execute(WEBHOOK_MODEL_ID);
            if (modelResult.isFail()) {
                return Result.fail(new WebhookModelNotFoundError(WEBHOOK_MODEL_ID));
            }

            const entryResult =
                await this.getLatestRevisionRepository.execute<WebhookCmsEntryValues>(
                    modelResult.value,
                    { id: webhook.id }
                );
            if (entryResult.isFail()) {
                return Result.fail(new WebhookPersistenceError(entryResult.error as any));
            }

            const values = await this.transformer.toStorage(webhook);

            const { entry } = await this.updateEntryDataFactory.create<WebhookCmsEntryValues>(
                modelResult.value,
                { values },
                entryResult.value
            );

            const updateResult = await this.updateEntryRepository.execute(modelResult.value, entry);

            if (updateResult.isFail()) {
                return Result.fail(new WebhookPersistenceError(updateResult.error as any));
            }

            return Result.ok(webhook);
        } catch (error) {
            return Result.fail(new WebhookPersistenceError(error as Error));
        }
    }
}

export const UpdateWebhookRepository = RepositoryAbstraction.createImplementation({
    implementation: UpdateWebhookRepositoryImpl,
    dependencies: [
        GetModelRepository,
        GetLatestRevisionByEntryIdRepository,
        UpdateEntryDataFactory,
        UpdateEntryRepository,
        WebhookTransformer
    ]
});
