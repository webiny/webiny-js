import { Result } from "@webiny/feature/api";
import { GetModelRepository } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { ListEntriesRepository } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/index.js";
import { WebhookDeliveryTransformer } from "~/api/features/Transformers/abstractions/WebhookDeliveryTransformer.js";
import {
    ListWebhookDeliveriesRepository as RepositoryAbstraction,
    type IListWebhookDeliveriesOutput
} from "./abstractions.js";
import { WebhookModelNotFoundError, WebhookPersistenceError } from "~/api/domain/errors.js";
import { WEBHOOK_DELIVERY_MODEL_ID } from "~/api/domain/constants.js";
import type { IListWebhookDeliveriesInput } from "./abstractions.js";
import type { WebhookDeliveryCmsEntryValues } from "~/api/domain/WebhookDelivery.js";

class ListWebhookDeliveriesRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private readonly getModelRepository: GetModelRepository.Interface,
        private readonly listEntriesRepository: ListEntriesRepository.Interface,
        private readonly transformer: WebhookDeliveryTransformer.Interface
    ) {}

    async execute(
        input: IListWebhookDeliveriesInput
    ): Promise<Result<IListWebhookDeliveriesOutput, RepositoryAbstraction.Error>> {
        try {
            const modelResult = await this.getModelRepository.execute(WEBHOOK_DELIVERY_MODEL_ID);
            if (modelResult.isFail()) {
                return Result.fail(new WebhookModelNotFoundError(WEBHOOK_DELIVERY_MODEL_ID));
            }

            const listResult =
                await this.listEntriesRepository.execute<WebhookDeliveryCmsEntryValues>(
                    modelResult.value,
                    {
                        where: { values: { webhookId: input.webhookId } },
                        sort: ["createdOn_DESC"],
                        limit: input.limit ?? 100,
                        after: input.after
                    }
                );

            if (listResult.isFail()) {
                return Result.fail(new WebhookPersistenceError(listResult.error as any));
            }

            const { entries, meta } = listResult.value;
            const items = await Promise.all(
                entries.map(entry => this.transformer.fromStorage(entry))
            );

            return Result.ok({
                items,
                meta: {
                    cursor: meta.cursor,
                    hasMoreItems: meta.hasMoreItems,
                    totalCount: meta.totalCount
                }
            });
        } catch (error) {
            return Result.fail(new WebhookPersistenceError(error as Error));
        }
    }
}

export const ListWebhookDeliveriesRepository = RepositoryAbstraction.createImplementation({
    implementation: ListWebhookDeliveriesRepositoryImpl,
    dependencies: [GetModelRepository, ListEntriesRepository, WebhookDeliveryTransformer]
});
