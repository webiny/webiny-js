import { Result } from "@webiny/feature/api";
import { ResendWebhookDeliveryUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetWebhookDeliveryRepository } from "~/api/features/GetWebhookDelivery/abstractions.js";
import { GetWebhookRepository } from "~/api/features/GetWebhook/abstractions.js";
import { CreateWebhookDeliveryRepository } from "~/api/features/CreateWebhookDelivery/abstractions.js";
import { WebhookPermissions } from "~/api/features/WebhookPermissions/abstractions.js";
import { WebhookNotAuthorizedError } from "~/api/domain/errors.js";
import { TaskService } from "@webiny/api-core/exports/api/tasks.js";
import { SEND_WEBHOOK_TASK, WEBHOOK_DELIVERY_RETENTION_DAYS } from "~/api/domain/constants.js";
import type { IWebhookPayload } from "~/api/domain/types.js";

class ResendWebhookDeliveryUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private permissions: WebhookPermissions.Interface,
        private getDeliveryRepository: GetWebhookDeliveryRepository.Interface,
        private getWebhookRepository: GetWebhookRepository.Interface,
        private createDeliveryRepository: CreateWebhookDeliveryRepository.Interface,
        private taskService: TaskService.Interface
    ) {}

    async execute(deliveryId: string): Promise<Result<boolean, UseCaseAbstraction.Error>> {
        if (!(await this.permissions.canEdit("webhook"))) {
            return Result.fail(new WebhookNotAuthorizedError());
        }

        const deliveryResult = await this.getDeliveryRepository.execute(deliveryId);
        if (deliveryResult.isFail()) {
            return Result.fail(deliveryResult.error);
        }

        const delivery = deliveryResult.value;

        const webhookResult = await this.getWebhookRepository.execute(delivery.values.webhookId);
        if (webhookResult.isFail()) {
            return Result.fail(webhookResult.error);
        }

        const originalPayload = delivery.values.payload as IWebhookPayload | null;
        const data = originalPayload?.data ?? {};

        const expiresAt = new Date(
            Date.now() + WEBHOOK_DELIVERY_RETENTION_DAYS * 24 * 60 * 60 * 1000
        ).toISOString();

        const newDeliveryResult = await this.createDeliveryRepository.execute({
            webhookId: delivery.values.webhookId,
            eventType: delivery.values.eventType,
            status: "pending",
            expiresAt
        });

        if (newDeliveryResult.isFail()) {
            return Result.fail(newDeliveryResult.error);
        }

        await this.taskService.trigger({
            definition: SEND_WEBHOOK_TASK,
            name: `Resend webhook: ${delivery.values.eventType}`,
            input: {
                webhookId: delivery.values.webhookId,
                eventName: delivery.values.eventType,
                data,
                deliveryId: newDeliveryResult.value.id
            }
        });

        return Result.ok(true);
    }
}

export default UseCaseAbstraction.createImplementation({
    implementation: ResendWebhookDeliveryUseCaseImpl,
    dependencies: [
        WebhookPermissions,
        GetWebhookDeliveryRepository,
        GetWebhookRepository,
        CreateWebhookDeliveryRepository,
        TaskService
    ]
});
