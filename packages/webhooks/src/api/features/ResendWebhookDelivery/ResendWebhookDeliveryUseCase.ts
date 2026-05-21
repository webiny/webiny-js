import { Result } from "@webiny/feature/api";
import { ResendWebhookDeliveryUseCase as UseCaseAbstraction } from "./abstractions.js";
import { ResendWebhookDeliveryInputSchema } from "./schema.js";
import { GetWebhookDeliveryRepository } from "~/api/features/GetWebhookDelivery/abstractions.js";
import { GetWebhookRepository } from "~/api/features/GetWebhook/abstractions.js";
import { CreateWebhookDeliveryRepository } from "~/api/features/CreateWebhookDelivery/abstractions.js";
import { WebhookPermissions } from "~/api/features/WebhookPermissions/abstractions.js";
import { WebhookNotAuthorizedError, WebhookValidationError } from "~/api/domain/errors.js";
import { TaskService } from "@webiny/api-core/exports/api/tasks.js";
import { SEND_WEBHOOK_TASK, WEBHOOK_DELIVERY_MAX_RETENTION_DAYS } from "~/api/domain/constants.js";
import type { IWebhookPayload } from "~/api/features/SendWebhookTask/types.js";

class ResendWebhookDeliveryUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private readonly permissions: WebhookPermissions.Interface,
        private readonly getDeliveryRepository: GetWebhookDeliveryRepository.Interface,
        private readonly getWebhookRepository: GetWebhookRepository.Interface,
        private readonly createDeliveryRepository: CreateWebhookDeliveryRepository.Interface,
        private readonly taskService: TaskService.Interface
    ) {}

    async execute(deliveryId: string): Promise<Result<boolean, UseCaseAbstraction.Error>> {
        if (!(await this.permissions.canEdit("webhook"))) {
            return Result.fail(new WebhookNotAuthorizedError());
        }

        const parsed = ResendWebhookDeliveryInputSchema.safeParse({ deliveryId });
        if (!parsed.success) {
            return Result.fail(new WebhookValidationError(parsed.error));
        }

        const deliveryResult = await this.getDeliveryRepository.execute(parsed.data.deliveryId);
        if (deliveryResult.isFail()) {
            return Result.fail(deliveryResult.error);
        }

        const delivery = deliveryResult.value;

        const webhookResult = await this.getWebhookRepository.execute(delivery.webhookId);
        if (webhookResult.isFail()) {
            return Result.fail(webhookResult.error);
        }

        const originalPayload = delivery.payload as IWebhookPayload | null;
        const data = originalPayload?.data ?? {};

        const expiresAt = new Date(
            Date.now() + WEBHOOK_DELIVERY_MAX_RETENTION_DAYS * 24 * 60 * 60 * 1000
        ).toISOString();

        const newDeliveryResult = await this.createDeliveryRepository.execute({
            webhookId: delivery.webhookId,
            eventType: delivery.eventType,
            status: "pending",
            payload: data as Record<string, unknown>,
            expiresAt
        });

        if (newDeliveryResult.isFail()) {
            return Result.fail(newDeliveryResult.error);
        }

        await this.taskService.trigger({
            definition: SEND_WEBHOOK_TASK,
            name: `Resend webhook: ${delivery.eventType}`,
            input: {
                webhookId: delivery.webhookId,
                eventName: delivery.eventType,
                deliveryId: newDeliveryResult.value.id
            }
        });

        return Result.ok(true);
    }
}

export const ResendWebhookDeliveryUseCase = UseCaseAbstraction.createImplementation({
    implementation: ResendWebhookDeliveryUseCaseImpl,
    dependencies: [
        WebhookPermissions,
        GetWebhookDeliveryRepository,
        GetWebhookRepository,
        CreateWebhookDeliveryRepository,
        TaskService
    ]
});
