import { Result } from "@webiny/feature/api";
import { GetModelUseCase } from "@webiny/api-headless-cms/exports/api/cms/model.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { ListEntriesUseCase } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { CreateWebhookRepository as RepositoryAbstraction } from "./abstractions.js";
import { WebhookModelNotFoundError, WebhookPersistenceError } from "~/api/domain/errors.js";
import { WEBHOOK_MODEL_ID } from "~/api/domain/constants.js";
import type { IWebhook } from "~/api/domain/types.js";

class CreateWebhookRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private getModelUseCase: GetModelUseCase.Interface,
        private createEntryUseCase: CreateEntryUseCase.Interface,
        private listEntriesUseCase: ListEntriesUseCase.Interface
    ) {}

    async slugExists(slug: string): Promise<boolean> {
        const modelResult = await this.getModelUseCase.execute(WEBHOOK_MODEL_ID);
        if (modelResult.isFail()) {
            return false;
        }

        const listResult = await this.listEntriesUseCase.execute(modelResult.value, {
            where: { values: { slug } },
            limit: 1
        });
        if (listResult.isFail()) {
            return false;
        }

        return listResult.value.entries.length > 0;
    }

    async execute(
        webhook: IWebhook
    ): Promise<Result<IWebhook, WebhookPersistenceError | WebhookModelNotFoundError>> {
        try {
            const modelResult = await this.getModelUseCase.execute(WEBHOOK_MODEL_ID);
            if (modelResult.isFail()) {
                return Result.fail(new WebhookModelNotFoundError(WEBHOOK_MODEL_ID));
            }

            const createResult = await this.createEntryUseCase.execute(modelResult.value, {
                id: webhook.id,
                values: webhook.values
            });

            if (createResult.isFail()) {
                return Result.fail(new WebhookPersistenceError(createResult.error as any));
            }

            return Result.ok(webhook);
        } catch (error) {
            return Result.fail(new WebhookPersistenceError(error as Error));
        }
    }
}

export const CreateWebhookRepository = RepositoryAbstraction.createImplementation({
    implementation: CreateWebhookRepositoryImpl,
    dependencies: [GetModelUseCase, CreateEntryUseCase, ListEntriesUseCase]
});
