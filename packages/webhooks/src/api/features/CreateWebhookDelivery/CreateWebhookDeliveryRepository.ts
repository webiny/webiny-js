import { Result } from "@webiny/feature/api";
import { GetModelUseCase } from "@webiny/api-headless-cms/exports/api/cms/model.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { CompressionHandler } from "@webiny/utils/exports/api.js";
import { CreateWebhookDeliveryRepository as RepositoryAbstraction } from "./abstractions.js";
import { WebhookModelNotFoundError, WebhookPersistenceError } from "~/api/domain/errors.js";
import { WEBHOOK_DELIVERY_MODEL_ID } from "~/api/domain/constants.js";
import type { ICreateDeliveryInput, IWebhookDelivery } from "~/api/domain/types.js";
import { randomBytes } from "node:crypto";

class CreateWebhookDeliveryRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private getModelUseCase: GetModelUseCase.Interface,
        private createEntryUseCase: CreateEntryUseCase.Interface,
        private compressionHandler: CompressionHandler.Interface
    ) {}

    async execute(
        input: ICreateDeliveryInput
    ): Promise<Result<IWebhookDelivery, RepositoryAbstraction.Error>> {
        try {
            const modelResult = await this.getModelUseCase.execute(WEBHOOK_DELIVERY_MODEL_ID);
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

            const createResult = await this.createEntryUseCase.execute(modelResult.value, {
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

            if (createResult.isFail()) {
                return Result.fail(new WebhookPersistenceError(createResult.error as any));
            }

            const delivery: IWebhookDelivery = {
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
            };

            return Result.ok(delivery);
        } catch (error) {
            return Result.fail(new WebhookPersistenceError(error as Error));
        }
    }
}

export default RepositoryAbstraction.createImplementation({
    implementation: CreateWebhookDeliveryRepositoryImpl,
    dependencies: [GetModelUseCase, CreateEntryUseCase, CompressionHandler]
});
