import { Result } from "@webiny/feature/api";
import { TaskService } from "@webiny/api-core/exports/api/tasks.js";
import { TriggerWebhookUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TriggerWebhookInputSchema } from "./schema.js";
import { GetWebhookRepository } from "~/api/features/GetWebhook/abstractions.js";
import { CreateWebhookDeliveryRepository } from "~/api/features/CreateWebhookDelivery/abstractions.js";
import { WebhookPermissions } from "~/api/features/WebhookPermissions/abstractions.js";
import { WebhookNotAuthorizedError, WebhookValidationError } from "~/api/domain/errors.js";
import { SEND_WEBHOOK_TASK, WEBHOOK_DELIVERY_RETENTION_DAYS } from "~/api/domain/constants.js";
import type { ISendWebhookTaskInput } from "~/api/features/SendWebhookTask/types.js";
import type { WebhookDelivery } from "~/api/domain/WebhookDelivery.js";

class TriggerWebhookUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private readonly permissions: WebhookPermissions.Interface,
        private readonly getWebhookRepository: GetWebhookRepository.Interface,
        private readonly createDeliveryRepository: CreateWebhookDeliveryRepository.Interface,
        private readonly taskService: TaskService.Interface
    ) {}

    async execute(
        webhookId: string,
        payload: Record<string, unknown>
    ): Promise<Result<WebhookDelivery, UseCaseAbstraction.Error>> {
        if (!(await this.permissions.canEdit("webhook"))) {
            return Result.fail(new WebhookNotAuthorizedError());
        }

        const parsed = TriggerWebhookInputSchema.safeParse({ webhookId, payload });
        if (!parsed.success) {
            return Result.fail(new WebhookValidationError(parsed.error));
        }

        const webhookResult = await this.getWebhookRepository.execute(parsed.data.webhookId);
        if (webhookResult.isFail()) {
            return Result.fail(webhookResult.error);
        }

        const webhook = webhookResult.value;

        const expiresAt = new Date(
            Date.now() + WEBHOOK_DELIVERY_RETENTION_DAYS * 24 * 60 * 60 * 1000
        ).toISOString();

        const deliveryResult = await this.createDeliveryRepository.execute({
            webhookId: webhook.id,
            eventType: "webhook.test",
            status: "pending",
            payload,
            expiresAt
        });

        if (deliveryResult.isFail()) {
            return Result.fail(deliveryResult.error);
        }

        const delivery = deliveryResult.value;

        await this.taskService.trigger<ISendWebhookTaskInput>({
            definition: SEND_WEBHOOK_TASK,
            name: `Test webhook: ${webhook.slug}`,
            input: {
                webhookId: webhook.id,
                eventName: "webhook.test",
                deliveryId: delivery.id
            }
        });

        return Result.ok(delivery);
    }
}

export const TriggerWebhookUseCase = UseCaseAbstraction.createImplementation({
    implementation: TriggerWebhookUseCaseImpl,
    dependencies: [
        WebhookPermissions,
        GetWebhookRepository,
        CreateWebhookDeliveryRepository,
        TaskService
    ]
});
