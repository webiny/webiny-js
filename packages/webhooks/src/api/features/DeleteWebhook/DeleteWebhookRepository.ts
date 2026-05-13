import { Result } from "@webiny/feature/api";
import type { CmsModel } from "@webiny/api-headless-cms/exports/api/cms/model.js";
import type { CmsEntry } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { GetModelRepository } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { GetLatestRevisionByEntryIdRepository } from "@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import { ListEntriesRepository } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { DeleteEntryRepository } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { DeleteWebhookRepository as RepositoryAbstraction } from "./abstractions.js";
import { WebhookModelNotFoundError, WebhookPersistenceError } from "~/api/domain/errors.js";
import { WEBHOOK_MODEL_ID, WEBHOOK_DELIVERY_MODEL_ID } from "~/api/domain/constants.js";

class DeleteWebhookRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private readonly getModelRepository: GetModelRepository.Interface,
        private readonly getLatestRevisionRepository: GetLatestRevisionByEntryIdRepository.Interface,
        private readonly listEntriesRepository: ListEntriesRepository.Interface,
        private readonly deleteEntryRepository: DeleteEntryRepository.Interface
    ) {}

    async execute(id: string): Promise<Result<boolean, RepositoryAbstraction.Error>> {
        try {
            const webhookModelResult = await this.getModelRepository.execute(WEBHOOK_MODEL_ID);
            if (webhookModelResult.isFail()) {
                return Result.fail(new WebhookModelNotFoundError(WEBHOOK_MODEL_ID));
            }

            const deliveryModelResult =
                await this.getModelRepository.execute(WEBHOOK_DELIVERY_MODEL_ID);
            if (!deliveryModelResult.isFail()) {
                await this.deleteAllDeliveries(deliveryModelResult.value, id);
            }

            const entryResult = await this.getLatestRevisionRepository.execute(
                webhookModelResult.value,
                { id }
            );
            if (entryResult.isFail()) {
                return Result.fail(new WebhookPersistenceError(entryResult.error as any));
            }

            const deleteResult = await this.deleteEntryRepository.execute(
                webhookModelResult.value,
                entryResult.value
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
            const listResult: Result<any, any> = await this.listEntriesRepository.execute(
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

            for (const entry of listResult.value.entries as CmsEntry[]) {
                await this.deleteEntryRepository.execute(deliveryModel, entry);
            }

            cursor = listResult.value.meta.cursor ?? undefined;
            hasMore = !!cursor;
        }
    }
}

export const DeleteWebhookRepository = RepositoryAbstraction.createImplementation({
    implementation: DeleteWebhookRepositoryImpl,
    dependencies: [
        GetModelRepository,
        GetLatestRevisionByEntryIdRepository,
        ListEntriesRepository,
        DeleteEntryRepository
    ]
});
