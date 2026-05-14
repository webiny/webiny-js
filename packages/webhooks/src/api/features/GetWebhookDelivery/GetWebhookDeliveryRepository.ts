import { Result } from "@webiny/feature/api";
import { GetModelRepository } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { GetLatestRevisionByEntryIdRepository } from "@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import { WebhookDeliveryTransformer } from "~/api/features/Transformers/abstractions/WebhookDeliveryTransformer.js";
import { GetWebhookDeliveryRepository as RepositoryAbstraction } from "./abstractions.js";
import {
    WebhookDeliveryNotFoundError,
    WebhookModelNotFoundError,
    WebhookPersistenceError
} from "~/api/domain/errors.js";
import { WEBHOOK_DELIVERY_MODEL_ID } from "~/api/domain/constants.js";
import type { WebhookDelivery, WebhookDeliveryCmsEntry } from "~/api/domain/WebhookDelivery.js";

class GetWebhookDeliveryRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private readonly getModelRepository: GetModelRepository.Interface,
        private readonly getLatestRevisionRepository: GetLatestRevisionByEntryIdRepository.Interface,
        private readonly transformer: WebhookDeliveryTransformer.Interface
    ) {}

    async execute(id: string): Promise<Result<WebhookDelivery, RepositoryAbstraction.Error>> {
        try {
            const modelResult = await this.getModelRepository.execute(WEBHOOK_DELIVERY_MODEL_ID);
            if (modelResult.isFail()) {
                return Result.fail(new WebhookModelNotFoundError(WEBHOOK_DELIVERY_MODEL_ID));
            }

            const entryResult = await this.getLatestRevisionRepository.execute<
                WebhookDeliveryCmsEntry["values"]
            >(modelResult.value, { id });

            if (entryResult.isFail()) {
                return Result.fail(new WebhookDeliveryNotFoundError(id));
            }

            const delivery = await this.transformer.fromStorage(entryResult.value);

            return Result.ok(delivery);
        } catch (error) {
            return Result.fail(new WebhookPersistenceError(error as Error));
        }
    }
}

export const GetWebhookDeliveryRepository = RepositoryAbstraction.createImplementation({
    implementation: GetWebhookDeliveryRepositoryImpl,
    dependencies: [
        GetModelRepository,
        GetLatestRevisionByEntryIdRepository,
        WebhookDeliveryTransformer
    ]
});
