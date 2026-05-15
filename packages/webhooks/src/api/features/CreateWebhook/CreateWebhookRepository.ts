import { Result } from "@webiny/feature/api";
import { GetModelRepository } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { CreateEntryDataFactory } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { CreateEntryRepository } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { ListEntriesRepository } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { WebhookTransformer } from "~/api/features/Transformers/abstractions/WebhookTransformer.js";
import { CreateWebhookRepository as RepositoryAbstraction } from "./abstractions.js";
import { WebhookModelNotFoundError, WebhookPersistenceError } from "~/api/domain/errors.js";
import { WEBHOOK_MODEL_ID } from "~/api/domain/constants.js";
import type { WebhookCmsEntryValues } from "~/api/domain/Webhook.js";

class CreateWebhookRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private readonly getModelRepository: GetModelRepository.Interface,
        private readonly createEntryRepository: CreateEntryRepository.Interface,
        private readonly listEntriesRepository: ListEntriesRepository.Interface,
        private readonly createEntryDataFactory: CreateEntryDataFactory.Interface,
        private readonly transformer: WebhookTransformer.Interface
    ) {}

    async slugExists(slug: string): Promise<boolean> {
        const modelResult = await this.getModelRepository.execute(WEBHOOK_MODEL_ID);
        if (modelResult.isFail()) {
            return false;
        }

        const listResult = await this.listEntriesRepository.execute(modelResult.value, {
            where: { values: { slug } },
            limit: 1
        });
        if (listResult.isFail()) {
            return false;
        }

        return listResult.value.entries.length > 0;
    }

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
                return Result.fail(new WebhookPersistenceError(createResult.error as any));
            }

            const webhook = this.transformer.fromStorage(entry);

            return Result.ok(webhook);
        } catch (error) {
            return Result.fail(new WebhookPersistenceError(error as Error));
        }
    }
}

export const CreateWebhookRepository = RepositoryAbstraction.createImplementation({
    implementation: CreateWebhookRepositoryImpl,
    dependencies: [
        GetModelRepository,
        CreateEntryRepository,
        ListEntriesRepository,
        CreateEntryDataFactory,
        WebhookTransformer
    ]
});
