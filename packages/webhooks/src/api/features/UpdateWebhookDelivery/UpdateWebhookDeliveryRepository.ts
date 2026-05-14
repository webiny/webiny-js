import { Result } from "@webiny/feature/api";
import { GetModelRepository } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { GetLatestRevisionByEntryIdRepository } from "@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import { UpdateEntryDataFactory } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { UpdateEntryRepository } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { WebhookDeliveryTransformer } from "~/api/features/Transformers/abstractions/WebhookDeliveryTransformer.js";
import { UpdateWebhookDeliveryRepository as RepositoryAbstraction } from "./abstractions.js";
import {
    WebhookDeliveryNotFoundError,
    WebhookModelNotFoundError,
    WebhookPersistenceError
} from "~/api/domain/errors.js";
import { WEBHOOK_DELIVERY_MODEL_ID } from "~/api/domain/constants.js";
import type { IUpdateDeliveryInput } from "./abstractions.js";
import type {
    WebhookDelivery,
    WebhookDeliveryCmsEntryValues
} from "~/api/domain/WebhookDelivery.js";

class UpdateWebhookDeliveryRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private readonly getModelRepository: GetModelRepository.Interface,
        private readonly getLatestRevisionRepository: GetLatestRevisionByEntryIdRepository.Interface,
        private readonly updateEntryDataFactory: UpdateEntryDataFactory.Interface,
        private readonly updateEntryRepository: UpdateEntryRepository.Interface,
        private readonly transformer: WebhookDeliveryTransformer.Interface
    ) {}

    async execute(
        id: string,
        input: IUpdateDeliveryInput
    ): Promise<Result<WebhookDelivery, RepositoryAbstraction.Error>> {
        try {
            const modelResult = await this.getModelRepository.execute(WEBHOOK_DELIVERY_MODEL_ID);
            if (modelResult.isFail()) {
                return Result.fail(new WebhookModelNotFoundError(WEBHOOK_DELIVERY_MODEL_ID));
            }

            const entryResult =
                await this.getLatestRevisionRepository.execute<WebhookDeliveryCmsEntryValues>(
                    modelResult.value,
                    { id }
                );

            if (entryResult.isFail()) {
                return Result.fail(new WebhookDeliveryNotFoundError(id));
            }

            const originalEntry = entryResult.value;
            const existing = await this.transformer.fromStorage(originalEntry);

            const updated: WebhookDelivery = {
                ...existing,
                backgroundTaskId: input.backgroundTaskId ?? existing.backgroundTaskId,
                status: input.status ?? existing.status,
                payload: input.payload ?? existing.payload,
                requestHeaders: input.requestHeaders ?? existing.requestHeaders,
                responseTime: input.responseTime ?? existing.responseTime,
                responseStatus: input.responseStatus ?? existing.responseStatus,
                responseBody: input.responseBody ?? existing.responseBody
            };

            const storageValues = await this.transformer.toStorage(updated);

            const { entry } =
                await this.updateEntryDataFactory.create<WebhookDeliveryCmsEntryValues>(
                    modelResult.value,
                    { values: storageValues },
                    originalEntry
                );

            const updateResult = await this.updateEntryRepository.execute(modelResult.value, entry);

            if (updateResult.isFail()) {
                return Result.fail(new WebhookPersistenceError(updateResult.error as any));
            }

            return Result.ok(updated);
        } catch (error) {
            return Result.fail(new WebhookPersistenceError(error as Error));
        }
    }
}

export const UpdateWebhookDeliveryRepository = RepositoryAbstraction.createImplementation({
    implementation: UpdateWebhookDeliveryRepositoryImpl,
    dependencies: [
        GetModelRepository,
        GetLatestRevisionByEntryIdRepository,
        UpdateEntryDataFactory,
        UpdateEntryRepository,
        WebhookDeliveryTransformer
    ]
});
