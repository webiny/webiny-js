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
import type { IWebhook, IWebhookValues } from "~/api/domain/types.js";
import { CmsEntryToWebhook } from "~/api/domain/CmsEntryToWebhook.js";

class GetWebhookRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private readonly getModelRepository: GetModelRepository.Interface,
        private readonly getLatestRevisionRepository: GetLatestRevisionByEntryIdRepository.Interface
    ) {}

    async execute(id: string): Promise<Result<IWebhook, RepositoryAbstraction.Error>> {
        try {
            const modelResult = await this.getModelRepository.execute(WEBHOOK_MODEL_ID);
            if (modelResult.isFail()) {
                return Result.fail(new WebhookModelNotFoundError(WEBHOOK_MODEL_ID));
            }

            const entryResult = await this.getLatestRevisionRepository.execute<IWebhookValues>(
                modelResult.value,
                { id }
            );

            if (entryResult.isFail()) {
                return Result.fail(new WebhookNotFoundError(id));
            }

            return Result.ok(CmsEntryToWebhook.map(entryResult.value));
        } catch (error) {
            return Result.fail(new WebhookPersistenceError(error as Error));
        }
    }
}

export const GetWebhookRepository = RepositoryAbstraction.createImplementation({
    implementation: GetWebhookRepositoryImpl,
    dependencies: [GetModelRepository, GetLatestRevisionByEntryIdRepository]
});
