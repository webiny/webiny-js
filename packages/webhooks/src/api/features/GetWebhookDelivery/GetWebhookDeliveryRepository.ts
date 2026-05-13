import { Result } from "@webiny/feature/api";
import { GetModelRepository } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { GetLatestRevisionByEntryIdRepository } from "@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import { CompressionHandler } from "@webiny/utils/exports/api.js";
import { GetWebhookDeliveryRepository as RepositoryAbstraction } from "./abstractions.js";
import {
    WebhookDeliveryNotFoundError,
    WebhookModelNotFoundError,
    WebhookPersistenceError
} from "~/api/domain/errors.js";
import { WEBHOOK_DELIVERY_MODEL_ID } from "~/api/domain/constants.js";
import type { IWebhookDelivery, WebhookDeliveryStatus } from "~/api/domain/types.js";

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

class GetWebhookDeliveryRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private readonly getModelRepository: GetModelRepository.Interface,
        private readonly getLatestRevisionRepository: GetLatestRevisionByEntryIdRepository.Interface,
        private readonly compressionHandler: CompressionHandler.Interface
    ) {}

    async execute(id: string): Promise<Result<IWebhookDelivery, RepositoryAbstraction.Error>> {
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

            const entry = entryResult.value;
            const raw = entry.values;

            const [payload, requestHeaders, responseBody] = await Promise.all([
                this.safeDecompress<object>(raw.payload),
                this.safeDecompress<object>(raw.requestHeaders),
                this.safeDecompress<string>(raw.responseBody)
            ]);

            return Result.ok({
                id: entry.entryId,
                values: {
                    webhookId: raw.webhookId,
                    backgroundTaskId: raw.backgroundTaskId,
                    eventType: raw.eventType,
                    status: raw.status,
                    payload,
                    requestHeaders,
                    responseTime: raw.responseTime,
                    responseStatus: raw.responseStatus,
                    responseBody,
                    expiresAt: raw.expiresAt
                },
                createdOn: entry.createdOn
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

export const GetWebhookDeliveryRepository = RepositoryAbstraction.createImplementation({
    implementation: GetWebhookDeliveryRepositoryImpl,
    dependencies: [GetModelRepository, GetLatestRevisionByEntryIdRepository, CompressionHandler]
});
