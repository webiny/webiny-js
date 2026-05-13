import { Result } from "@webiny/feature/api";
import { GetModelUseCase } from "@webiny/api-headless-cms/exports/api/cms/model.js";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { UpdateWebhookRepository as RepositoryAbstraction } from "./abstractions.js";
import { WebhookModelNotFoundError, WebhookPersistenceError } from "~/api/domain/errors.js";
import { WEBHOOK_MODEL_ID } from "~/api/domain/constants.js";
import type { IWebhook } from "~/api/domain/types.js";

class UpdateWebhookRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private getModelUseCase: GetModelUseCase.Interface,
        private updateEntryUseCase: UpdateEntryUseCase.Interface
    ) {}

    async execute(webhook: IWebhook): Promise<Result<IWebhook, RepositoryAbstraction.Error>> {
        try {
            const modelResult = await this.getModelUseCase.execute(WEBHOOK_MODEL_ID);
            if (modelResult.isFail()) {
                return Result.fail(new WebhookModelNotFoundError(WEBHOOK_MODEL_ID));
            }

            const updateResult = await this.updateEntryUseCase.execute(
                modelResult.value,
                webhook.id,
                { values: webhook.values }
            );

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
    dependencies: [GetModelUseCase, UpdateEntryUseCase]
});
