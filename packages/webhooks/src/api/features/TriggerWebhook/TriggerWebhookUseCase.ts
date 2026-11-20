import { Result } from "@webiny/feature/api";
import { TaskService } from "@webiny/api-core/exports/api/tasks.js";
import { TriggerWebhookUseCase as UseCaseAbstraction } from "./abstractions.js";
import { TriggerWebhookInputSchema } from "./schema.js";
import { GetWebhookRepository } from "~/api/features/GetWebhook/abstractions.js";
import { CreateWebhookDeliveryRepository } from "~/api/features/CreateWebhookDelivery/abstractions.js";
import { UpdateWebhookDeliveryRepository } from "~/api/features/UpdateWebhookDelivery/abstractions.js";
import { GetWebhookSettingsRepository } from "~/api/features/GetWebhookSettings/abstractions.js";
import { WebhookPermissions } from "~/api/features/WebhookPermissions/abstractions.js";
import { WebhookNotAuthorizedError, WebhookValidationError } from "~/api/domain/errors.js";
import { WebhookDeliveryNotQueuedError } from "~/api/domain/errors.js";
import { SEND_WEBHOOK_TASK, WEBHOOK_DELIVERY_MAX_RETENTION_DAYS } from "~/api/domain/constants.js";
import type { ISendWebhookTaskInput } from "~/api/features/SendWebhookTask/types.js";
import type { WebhookDelivery } from "~/api/domain/WebhookDelivery.js";

class TriggerWebhookUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private readonly permissions: WebhookPermissions.Interface,
        private readonly getWebhookRepository: GetWebhookRepository.Interface,
        private readonly createDeliveryRepository: CreateWebhookDeliveryRepository.Interface,
        private readonly taskService: TaskService.Interface,
        private readonly getSettingsRepository: GetWebhookSettingsRepository.Interface,
        private readonly updateDeliveryRepository: UpdateWebhookDeliveryRepository.Interface
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

        const settingsResult = await this.getSettingsRepository.execute();
        const retentionDays = settingsResult.isOk()
            ? (settingsResult.value.deliveryRetentionDays ?? WEBHOOK_DELIVERY_MAX_RETENTION_DAYS)
            : WEBHOOK_DELIVERY_MAX_RETENTION_DAYS;

        const expiresAt = new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000);

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

        const triggered = await this.taskService.trigger<ISendWebhookTaskInput>({
            definition: SEND_WEBHOOK_TASK,
            name: `Test webhook: ${webhook.slug}`,
            input: {
                webhookId: webhook.id,
                eventName: "webhook.test",
                deliveryId: delivery.id
            }
        });
        if (triggered.isFail()) {
            // Nothing will send this delivery, so it must not stay pending.
            const marked = await this.updateDeliveryRepository.execute(delivery.id, {
                status: "failed"
            });
            return Result.fail(
                new WebhookDeliveryNotQueuedError({
                    message: triggered.error.message,
                    deliveryId: delivery.id,
                    markedFailed: marked.isOk()
                })
            );
        }

        return Result.ok(delivery);
    }
}

export const TriggerWebhookUseCase = UseCaseAbstraction.createImplementation({
    implementation: TriggerWebhookUseCaseImpl,
    dependencies: [
        WebhookPermissions,
        GetWebhookRepository,
        CreateWebhookDeliveryRepository,
        TaskService,
        GetWebhookSettingsRepository,
        UpdateWebhookDeliveryRepository
    ]
});
