import { Result } from "@webiny/feature/api";
import { GetModelRepository } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { GetLatestRevisionByEntryIdRepository } from "@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import { GetWebhookRepository as RepositoryAbstraction } from "./abstractions.js";
import {
    WebhookNotFoundError,
    WebhookModelNotFoundError,
    WebhookPersistenceError
} from "~/api/domain/errors.js";
import { WEBHOOK_MODEL_ID } from "~/api/domain/constants.js";
import type { Webhook, WebhookCmsEntry } from "~/api/domain/Webhook.js";

class GetWebhookRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private readonly getModelRepository: GetModelRepository.Interface,
        private readonly getLatestRevisionRepository: GetLatestRevisionByEntryIdRepository.Interface
    ) {}

    async execute(id: string): Promise<Result<Webhook, RepositoryAbstraction.Error>> {
        try {
            const modelResult = await this.getModelRepository.execute(WEBHOOK_MODEL_ID);
            if (modelResult.isFail()) {
                return Result.fail(new WebhookModelNotFoundError(WEBHOOK_MODEL_ID));
            }

            const entryResult = await this.getLatestRevisionRepository.execute<
                WebhookCmsEntry["values"]
            >(modelResult.value, { id });

            if (entryResult.isFail()) {
                return Result.fail(new WebhookNotFoundError(id));
            }

            const entry = entryResult.value;
            return Result.ok({
                id: entry.entryId,
                name: entry.values.name,
                slug: entry.values.slug,
                endpointUrl: entry.values.endpointUrl,
                description: entry.values.description,
                enabled: entry.values.enabled,
                events: entry.values.events,
                signingSecret: entry.values.signingSecret,
                createdOn: entry.createdOn,
                savedOn: entry.savedOn
            });
        } catch (error) {
            return Result.fail(new WebhookPersistenceError(error as Error));
        }
    }
}

export const GetWebhookRepository = RepositoryAbstraction.createImplementation({
    implementation: GetWebhookRepositoryImpl,
    dependencies: [GetModelRepository, GetLatestRevisionByEntryIdRepository]
});
