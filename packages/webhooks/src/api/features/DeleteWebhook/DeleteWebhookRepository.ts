import { Result } from "@webiny/feature/api";
import { GetModelUseCase } from "@webiny/api-headless-cms/exports/api/cms/model.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { ListEntriesUseCase } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import type { CmsModel } from "@webiny/api-headless-cms/exports/api/cms/model.js";
import { DeleteWebhookRepository as RepositoryAbstraction } from "./abstractions.js";
import { WebhookModelNotFoundError, WebhookPersistenceError } from "~/api/domain/errors.js";
import { WEBHOOK_MODEL_ID, WEBHOOK_DELIVERY_MODEL_ID } from "~/api/domain/constants.js";

class DeleteWebhookRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private getModelUseCase: GetModelUseCase.Interface,
        private listEntriesUseCase: ListEntriesUseCase.Interface,
        private deleteEntryUseCase: DeleteEntryUseCase.Interface
    ) {}

    async execute(id: string): Promise<Result<boolean, RepositoryAbstraction.Error>> {
        try {
            const webhookModelResult = await this.getModelUseCase.execute(WEBHOOK_MODEL_ID);
            if (webhookModelResult.isFail()) {
                return Result.fail(new WebhookModelNotFoundError(WEBHOOK_MODEL_ID));
            }

            const deliveryModelResult =
                await this.getModelUseCase.execute(WEBHOOK_DELIVERY_MODEL_ID);
            if (!deliveryModelResult.isFail()) {
                await this.deleteAllDeliveries(deliveryModelResult.value, id);
            }

            const deleteResult = await this.deleteEntryUseCase.execute(
                webhookModelResult.value,
                id
            );

            if (deleteResult.isFail()) {
                return Result.fail(new WebhookPersistenceError(deleteResult.error as any));
            }

            return Result.ok(true);
        } catch (error) {
            return Result.fail(new WebhookPersistenceError(error as Error));
        }
    }

    private async deleteAllDeliveries(deliveryModel: CmsModel, webhookId: string): Promise<void> {
        let cursor: string | undefined = undefined;
        let hasMore = true;
        while (hasMore) {
            /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
            const listResult: Result<any, any> = await this.listEntriesUseCase.execute(
                deliveryModel,
                {
                    where: { values: { webhookId } },
                    limit: 100,
                    after: cursor
                }
            );

            if (listResult.isFail()) {
                break;
            }

            for (const entry of listResult.value.entries) {
                await this.deleteEntryUseCase.execute(deliveryModel, entry.entryId);
            }

            cursor = listResult.value.meta.cursor ?? undefined;
            hasMore = !!cursor;
        }
    }
}

export default RepositoryAbstraction.createImplementation({
    implementation: DeleteWebhookRepositoryImpl,
    dependencies: [GetModelUseCase, ListEntriesUseCase, DeleteEntryUseCase]
});
