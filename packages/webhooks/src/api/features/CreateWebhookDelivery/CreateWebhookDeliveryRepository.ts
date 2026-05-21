import { Result } from "@webiny/feature/api";
import { GetModelRepository } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { CreateEntryDataFactory } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { CreateEntryRepository } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { WebhookDeliveryTransformer } from "~/api/features/Transformers/abstractions/WebhookDeliveryTransformer.js";
import type { ICreateDeliveryInput } from "./abstractions.js";
import { CreateWebhookDeliveryRepository as RepositoryAbstraction } from "./abstractions.js";
import { WebhookModelNotFoundError, WebhookPersistenceError } from "~/api/domain/errors.js";
import { WEBHOOK_DELIVERY_MODEL_ID } from "~/api/domain/constants.js";
import type {
    WebhookDelivery,
    WebhookDeliveryCmsEntryValues
} from "~/api/domain/WebhookDelivery.js";

class CreateWebhookDeliveryRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private readonly getModelRepository: GetModelRepository.Interface,
        private readonly createEntryDataFactory: CreateEntryDataFactory.Interface,
        private readonly createEntryRepository: CreateEntryRepository.Interface,
        private readonly transformer: WebhookDeliveryTransformer.Interface
    ) {}

    async execute(
        input: ICreateDeliveryInput
    ): Promise<Result<WebhookDelivery, RepositoryAbstraction.Error>> {
        try {
            const modelResult = await this.getModelRepository.execute(WEBHOOK_DELIVERY_MODEL_ID);
            if (modelResult.isFail()) {
                return Result.fail(new WebhookModelNotFoundError(WEBHOOK_DELIVERY_MODEL_ID));
            }

            const storageValues = this.transformer.toStorage({
                id: "",
                createdOn: "",
                savedOn: "",
                webhookId: input.webhookId,
                backgroundTaskId: null,
                eventType: input.eventType,
                status: input.status,
                payload: input.payload,
                requestHeaders: null,
                responseTime: null,
                responseStatus: null,
                responseHeaders: null,
                responseBody: null
            });

            const expiresAt = new Date(input.expiresAt);

            const { entry } =
                await this.createEntryDataFactory.create<WebhookDeliveryCmsEntryValues>(
                    modelResult.value,
                    {
                        values: storageValues,
                        expiresAt
                    }
                );

            const createResult = await this.createEntryRepository.execute(modelResult.value, entry);

            if (createResult.isFail()) {
                return Result.fail(WebhookPersistenceError.from(createResult.error));
            }

            const delivery = this.transformer.fromStorage(entry);

            return Result.ok(delivery);
        } catch (error) {
            return Result.fail(WebhookPersistenceError.from(error));
        }
    }
}

export const CreateWebhookDeliveryRepository = RepositoryAbstraction.createImplementation({
    implementation: CreateWebhookDeliveryRepositoryImpl,
    dependencies: [
        GetModelRepository,
        CreateEntryDataFactory,
        CreateEntryRepository,
        WebhookDeliveryTransformer
    ]
});
