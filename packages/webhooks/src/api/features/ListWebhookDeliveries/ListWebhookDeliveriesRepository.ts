import { Result } from "@webiny/feature/api";
import { GetModelUseCase } from "@webiny/api-headless-cms/exports/api/cms/model.js";
import { ListEntriesUseCase } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import {
    ListWebhookDeliveriesRepository as RepositoryAbstraction,
    type IListWebhookDeliveriesOutput
} from "./abstractions.js";
import { WebhookModelNotFoundError, WebhookPersistenceError } from "~/api/domain/errors.js";
import { WEBHOOK_DELIVERY_MODEL_ID } from "~/api/domain/constants.js";
import type { IListWebhookDeliveriesInput } from "~/api/domain/types.js";

interface IRawDeliveryListValues {
    webhookId: string;
    backgroundTaskId: string;
    eventType: string;
    responseTime: number;
    responseStatus: number;
    expiresAt: string;
}

class ListWebhookDeliveriesRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private getModelUseCase: GetModelUseCase.Interface,
        private listEntriesUseCase: ListEntriesUseCase.Interface
    ) {}

    async execute(
        input: IListWebhookDeliveriesInput
    ): Promise<Result<IListWebhookDeliveriesOutput, RepositoryAbstraction.Error>> {
        try {
            const modelResult = await this.getModelUseCase.execute(WEBHOOK_DELIVERY_MODEL_ID);
            if (modelResult.isFail()) {
                return Result.fail(new WebhookModelNotFoundError(WEBHOOK_DELIVERY_MODEL_ID));
            }

            const listResult = await this.listEntriesUseCase.execute<IRawDeliveryListValues>(
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
            return Result.ok({
                items: entries.map(entry => ({
                    id: entry.entryId,
                    values: {
                        webhookId: entry.values.webhookId,
                        backgroundTaskId: entry.values.backgroundTaskId,
                        eventType: entry.values.eventType,
                        payload: null,
                        requestHeaders: null,
                        responseTime: entry.values.responseTime,
                        responseStatus: entry.values.responseStatus,
                        responseBody: null,
                        expiresAt: entry.values.expiresAt
                    },
                    createdOn: entry.createdOn
                })),
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

export default RepositoryAbstraction.createImplementation({
    implementation: ListWebhookDeliveriesRepositoryImpl,
    dependencies: [GetModelUseCase, ListEntriesUseCase]
});
