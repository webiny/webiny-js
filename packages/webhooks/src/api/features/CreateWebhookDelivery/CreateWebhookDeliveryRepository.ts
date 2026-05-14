import { Result } from "@webiny/feature/api";
import { GetModelRepository } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { CreateEntryDataFactory } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { CreateEntryRepository } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { CompressionHandler } from "@webiny/utils/exports/api.js";
import { CreateWebhookDeliveryRepository as RepositoryAbstraction } from "./abstractions.js";
import { WebhookModelNotFoundError, WebhookPersistenceError } from "~/api/domain/errors.js";
import { WEBHOOK_DELIVERY_MODEL_ID } from "~/api/domain/constants.js";
import type { ICreateDeliveryInput } from "./abstractions.js";
import type { WebhookDelivery, WebhookDeliveryCmsEntry } from "~/api/domain/WebhookDelivery.js";

class CreateWebhookDeliveryRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private readonly getModelRepository: GetModelRepository.Interface,
        private readonly createEntryDataFactory: CreateEntryDataFactory.Interface,
        private readonly createEntryRepository: CreateEntryRepository.Interface,
        private readonly compressionHandler: CompressionHandler.Interface
    ) {}

    async execute(
        input: ICreateDeliveryInput
    ): Promise<Result<WebhookDelivery, RepositoryAbstraction.Error>> {
        try {
            const modelResult = await this.getModelRepository.execute(WEBHOOK_DELIVERY_MODEL_ID);
            if (modelResult.isFail()) {
                return Result.fail(new WebhookModelNotFoundError(WEBHOOK_DELIVERY_MODEL_ID));
            }

            const compressedPayload = this.compressionHandler.compress(input.payload);

            const { entry } = await this.createEntryDataFactory.create<
                WebhookDeliveryCmsEntry["values"]
            >(modelResult.value, {
                values: {
                    webhookId: input.webhookId,
                    backgroundTaskId: null,
                    eventType: input.eventType,
                    status: "pending",
                    payload: JSON.stringify(compressedPayload),
                    requestHeaders: null,
                    responseTime: null,
                    responseStatus: null,
                    responseHeaders: null,
                    responseBody: null,
                    expiresAt: input.expiresAt
                }
            });

            const createResult = await this.createEntryRepository.execute(modelResult.value, entry);

            if (createResult.isFail()) {
                return Result.fail(new WebhookPersistenceError(createResult.error as any));
            }

            return Result.ok({
                id: entry.entryId,
                webhookId: entry.values.webhookId,
                backgroundTaskId: entry.values.backgroundTaskId,
                eventType: entry.values.eventType,
                status: entry.values.status,
                payload: input.payload,
                requestHeaders: null,
                responseTime: entry.values.responseTime,
                responseStatus: entry.values.responseStatus,
                responseHeaders: null,
                responseBody: null,
                createdOn: entry.createdOn,
                savedOn: entry.savedOn
            });
        } catch (error) {
            return Result.fail(new WebhookPersistenceError(error as Error));
        }
    }
}

export const CreateWebhookDeliveryRepository = RepositoryAbstraction.createImplementation({
    implementation: CreateWebhookDeliveryRepositoryImpl,
    dependencies: [
        GetModelRepository,
        CreateEntryDataFactory,
        CreateEntryRepository,
        CompressionHandler
    ]
});
