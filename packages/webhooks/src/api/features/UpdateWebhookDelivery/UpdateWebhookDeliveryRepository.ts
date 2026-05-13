import { Result } from "@webiny/feature/api";
import { GetModelRepository } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { GetLatestRevisionByEntryIdRepository } from "@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import { UpdateEntryDataFactory } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { UpdateEntryRepository } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { CompressionHandler } from "@webiny/utils/exports/api.js";
import { UpdateWebhookDeliveryRepository as RepositoryAbstraction } from "./abstractions.js";
import {
    WebhookDeliveryNotFoundError,
    WebhookModelNotFoundError,
    WebhookPersistenceError
} from "~/api/domain/errors.js";
import { WEBHOOK_DELIVERY_MODEL_ID } from "~/api/domain/constants.js";
import type {
    IUpdateDeliveryInput,
    IWebhookDelivery,
    WebhookDeliveryStatus
} from "~/api/domain/types.js";

interface IRawDeliveryValues {
    webhookId: string;
    backgroundTaskId: string | null;
    eventType: string;
    status: WebhookDeliveryStatus;
    payload: string | null;
    requestHeaders: string | null;
    responseTime: number | null;
    responseStatus: number | null;
    responseBody: string | null;
    expiresAt: string;
}

class UpdateWebhookDeliveryRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private readonly getModelRepository: GetModelRepository.Interface,
        private readonly getLatestRevisionRepository: GetLatestRevisionByEntryIdRepository.Interface,
        private readonly updateEntryDataFactory: UpdateEntryDataFactory.Interface,
        private readonly updateEntryRepository: UpdateEntryRepository.Interface,
        private readonly compressionHandler: CompressionHandler.Interface
    ) {}

    async execute(
        id: string,
        input: IUpdateDeliveryInput
    ): Promise<Result<IWebhookDelivery, RepositoryAbstraction.Error>> {
        try {
            const modelResult = await this.getModelRepository.execute(WEBHOOK_DELIVERY_MODEL_ID);
            if (modelResult.isFail()) {
                return Result.fail(new WebhookModelNotFoundError(WEBHOOK_DELIVERY_MODEL_ID));
            }

            const entryResult = await this.getLatestRevisionRepository.execute<IRawDeliveryValues>(
                modelResult.value,
                { id }
            );
            if (entryResult.isFail()) {
                return Result.fail(new WebhookDeliveryNotFoundError(id));
            }

            const originalEntry = entryResult.value;
            const existing = originalEntry.values;

            const [compressedPayload, compressedHeaders, compressedBody] = await Promise.all([
                input.payload ? this.compressionHandler.compress(input.payload) : null,
                input.requestHeaders
                    ? this.compressionHandler.compress(input.requestHeaders)
                    : null,
                input.responseBody ? this.compressionHandler.compress(input.responseBody) : null
            ]);

            const updatedValues: IRawDeliveryValues = {
                webhookId: existing.webhookId,
                backgroundTaskId: input.backgroundTaskId ?? existing.backgroundTaskId,
                eventType: existing.eventType,
                status: input.status ?? existing.status,
                payload: compressedPayload ? JSON.stringify(compressedPayload) : existing.payload,
                requestHeaders: compressedHeaders
                    ? JSON.stringify(compressedHeaders)
                    : existing.requestHeaders,
                responseTime: input.responseTime ?? existing.responseTime,
                responseStatus: input.responseStatus ?? existing.responseStatus,
                responseBody: compressedBody
                    ? JSON.stringify(compressedBody)
                    : existing.responseBody,
                expiresAt: existing.expiresAt
            };

            const { entry } = await this.updateEntryDataFactory.create<IRawDeliveryValues>(
                modelResult.value,
                { values: updatedValues },
                originalEntry
            );

            const updateResult = await this.updateEntryRepository.execute(modelResult.value, entry);

            if (updateResult.isFail()) {
                return Result.fail(new WebhookPersistenceError(updateResult.error as any));
            }

            const [payload, requestHeaders, responseBody] = await Promise.all([
                this.safeDecompress<object>(updatedValues.payload),
                this.safeDecompress<object>(updatedValues.requestHeaders),
                this.safeDecompress<string>(updatedValues.responseBody)
            ]);

            return Result.ok({
                id: originalEntry.entryId,
                values: {
                    webhookId: updatedValues.webhookId,
                    backgroundTaskId: updatedValues.backgroundTaskId,
                    eventType: updatedValues.eventType,
                    status: updatedValues.status,
                    payload,
                    requestHeaders,
                    responseTime: updatedValues.responseTime,
                    responseStatus: updatedValues.responseStatus,
                    responseBody,
                    expiresAt: updatedValues.expiresAt
                },
                createdOn: originalEntry.createdOn
            });
        } catch (error) {
            return Result.fail(new WebhookPersistenceError(error as Error));
        }
    }

    private async safeDecompress<T>(stored: string | null): Promise<T | null> {
        if (!stored) {
            return null;
        }
        try {
            return await this.compressionHandler.decompress<T>(JSON.parse(stored));
        } catch {
            return null;
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
        CompressionHandler
    ]
});
