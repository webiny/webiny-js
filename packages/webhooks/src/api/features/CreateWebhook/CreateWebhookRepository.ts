import { Result } from "@webiny/feature/api";
import { GetModelRepository } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { CreateEntryDataFactory } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { CreateEntryRepository } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { WebhookTransformer } from "~/api/features/Transformers/abstractions/WebhookTransformer.js";
import { CreateWebhookRepository as RepositoryAbstraction } from "./abstractions.js";
import { WebhookModelNotFoundError, WebhookPersistenceError } from "~/api/domain/errors.js";
import { WEBHOOK_MODEL_ID } from "~/api/domain/constants.js";
import type { WebhookCmsEntryValues } from "~/api/domain/Webhook.js";

class CreateWebhookRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private readonly getModelRepository: GetModelRepository.Interface,
        private readonly createEntryRepository: CreateEntryRepository.Interface,
        private readonly createEntryDataFactory: CreateEntryDataFactory.Interface,
        private readonly transformer: WebhookTransformer.Interface
    ) {}

    async execute(input: WebhookCmsEntryValues): Promise<RepositoryAbstraction.Response> {
        try {
            const modelResult = await this.getModelRepository.execute(WEBHOOK_MODEL_ID);
            if (modelResult.isFail()) {
                return Result.fail(new WebhookModelNotFoundError(WEBHOOK_MODEL_ID));
            }

            const { entry } = await this.createEntryDataFactory.create<WebhookCmsEntryValues>(
                modelResult.value,
                { values: input }
            );

            const createResult = await this.createEntryRepository.execute(modelResult.value, entry);

            if (createResult.isFail()) {
                return Result.fail(WebhookPersistenceError.from(createResult.error));
            }

            const webhook = this.transformer.fromStorage(entry);

            return Result.ok(webhook);
        } catch (error) {
            return Result.fail(WebhookPersistenceError.from(error));
        }
    }
}

export const CreateWebhookRepository = RepositoryAbstraction.createImplementation({
    implementation: CreateWebhookRepositoryImpl,
    dependencies: [
        GetModelRepository,
        CreateEntryRepository,
        CreateEntryDataFactory,
        WebhookTransformer
    ]
});
