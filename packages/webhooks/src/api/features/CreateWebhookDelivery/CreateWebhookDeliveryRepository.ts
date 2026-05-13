import { Result } from "@webiny/feature/api";
import { GetModelRepository } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { CreateEntryDataFactory } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { CreateEntryRepository } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { CompressionHandler } from "@webiny/utils/exports/api.js";
import { CreateWebhookDeliveryRepository as RepositoryAbstraction } from "./abstractions.js";
import { WebhookModelNotFoundError, WebhookPersistenceError } from "~/api/domain/errors.js";
import { WEBHOOK_DELIVERY_MODEL_ID } from "~/api/domain/constants.js";
import type { ICreateDeliveryInput, IWebhookDelivery } from "~/api/domain/types.js";
import { randomBytes } from "node:crypto";

class CreateWebhookDeliveryRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private readonly getModelRepository: GetModelRepository.Interface,
        private readonly createEntryDataFactory: CreateEntryDataFactory.Interface,
        private readonly createEntryRepository: CreateEntryRepository.Interface,
        private readonly compressionHandler: CompressionHandler.Interface
    ) {}

    async execute(
        input: ICreateDeliveryInput
    ): Promise<Result<IWebhookDelivery, RepositoryAbstraction.Error>> {
        try {
            const modelResult = await this.getModelRepository.execute(WEBHOOK_DELIVERY_MODEL_ID);
            if (modelResult.isFail()) {
                return Result.fail(new WebhookModelNotFoundError(WEBHOOK_DELIVERY_MODEL_ID));
            }

            const [compressedPayload, compressedHeaders, compressedBody] = await Promise.all([
                input.payload ? this.compressionHandler.compress(input.payload) : null,
                input.requestHeaders
                    ? this.compressionHandler.compress(input.requestHeaders)
                    : null,
                input.responseBody ? this.compressionHandler.compress(input.responseBody) : null
            ]);

            const id = randomBytes(8).toString("hex");

            const { entry } = await this.createEntryDataFactory.create(modelResult.value, {
                id,
                values: {
                    webhookId: input.webhookId,
                    backgroundTaskId: input.backgroundTaskId ?? null,
                    eventType: input.eventType,
                    status: input.status,
                    payload: compressedPayload ? JSON.stringify(compressedPayload) : null,
                    requestHeaders: compressedHeaders ? JSON.stringify(compressedHeaders) : null,
                    responseTime: input.responseTime ?? null,
                    responseStatus: input.responseStatus ?? null,
                    responseBody: compressedBody ? JSON.stringify(compressedBody) : null,
                    expiresAt: input.expiresAt
                }
            });

            const createResult = await this.createEntryRepository.execute(modelResult.value, entry);

            if (createResult.isFail()) {
                return Result.fail(new WebhookPersistenceError(createResult.error as any));
            }

            return Result.ok({
                id,
                values: {
                    webhookId: input.webhookId,
                    backgroundTaskId: input.backgroundTaskId ?? null,
                    eventType: input.eventType,
                    status: input.status,
                    payload: input.payload ?? null,
                    requestHeaders: input.requestHeaders ?? null,
                    responseTime: input.responseTime ?? null,
                    responseStatus: input.responseStatus ?? null,
                    responseBody: input.responseBody ?? null,
                    expiresAt: input.expiresAt
                }
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
