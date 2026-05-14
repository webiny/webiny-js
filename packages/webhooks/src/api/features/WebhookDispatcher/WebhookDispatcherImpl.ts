import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";
import { TaskService } from "@webiny/api-core/exports/api/tasks.js";
import { ListWebhooksRepository } from "~/api/features/ListWebhooks/abstractions.js";
import { CreateWebhookDeliveryRepository } from "~/api/features/CreateWebhookDelivery/abstractions.js";
import { SEND_WEBHOOK_TASK, WEBHOOK_DELIVERY_RETENTION_DAYS } from "~/api/domain/constants.js";
import type { IWebhookDispatcherData } from "@webiny/api-core/features/webhooks/WebhookDispatcher/abstractions.js";

class WebhookDispatcherImpl_ implements WebhookDispatcher.Interface {
    constructor(
        private listWebhooksRepository: ListWebhooksRepository.Interface,
        private createDeliveryRepository: CreateWebhookDeliveryRepository.Interface,
        private taskService: TaskService.Interface
    ) {}

    async dispatch<T extends IWebhookDispatcherData = IWebhookDispatcherData>(
        eventName: string,
        data: T
    ): Promise<void> {
        const result = await this.listWebhooksRepository.execute({
            where: {
                enabled: true,
                events: eventName
            }
        });

        if (result.isFail()) {
            return;
        }

        const expiresAt = new Date(
            Date.now() + WEBHOOK_DELIVERY_RETENTION_DAYS * 24 * 60 * 60 * 1000
        ).toISOString();

        for (const webhook of result.value.items) {
            const deliveryResult = await this.createDeliveryRepository.execute({
                webhookId: webhook.id,
                eventType: eventName,
                status: "pending",
                expiresAt
            });

            if (deliveryResult.isFail()) {
                continue;
            }

            await this.taskService.trigger({
                definition: SEND_WEBHOOK_TASK,
                name: `Send webhook: ${webhook.slug} — ${eventName}`,
                input: {
                    webhookId: webhook.id,
                    eventName,
                    data,
                    deliveryId: deliveryResult.value.id
                }
            });
        }
    }
}

export const WebhookDispatcherImpl = WebhookDispatcher.createImplementation({
    implementation: WebhookDispatcherImpl_,
    dependencies: [ListWebhooksRepository, CreateWebhookDeliveryRepository, TaskService]
});
