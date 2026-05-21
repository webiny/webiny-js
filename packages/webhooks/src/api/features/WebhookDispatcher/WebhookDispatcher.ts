import {
    WebhookDispatcher as WebhookDispatcherAbstraction,
    WebhookProvider
} from "@webiny/api-core/features/webhooks/index.js";
import { TaskService } from "@webiny/api-core/exports/api/tasks.js";
import { ListWebhooksRepository } from "~/api/features/ListWebhooks/abstractions.js";
import { CreateWebhookDeliveryRepository } from "~/api/features/CreateWebhookDelivery/abstractions.js";
import { SEND_WEBHOOK_TASK, WEBHOOK_DELIVERY_MAX_RETENTION_DAYS } from "~/api/domain/constants.js";
import type { IWebhookDispatcherData } from "@webiny/api-core/features/webhooks/WebhookDispatcher/abstractions.js";
import type { ISendWebhookTaskInput } from "~/api/features/SendWebhookTask/types.js";

class WebhookDispatcherImpl implements WebhookDispatcherAbstraction.Interface {
    constructor(
        private readonly listWebhooksRepository: ListWebhooksRepository.Interface,
        private readonly createDeliveryRepository: CreateWebhookDeliveryRepository.Interface,
        private readonly taskService: TaskService.Interface,
        private readonly provider: WebhookProvider.Interface
    ) {}

    async dispatch<T extends IWebhookDispatcherData = IWebhookDispatcherData>(
        eventName: string,
        payload: T
    ): Promise<void> {
        /**
         * Let's first check if there is defined webhook event with the given name.
         * If not, we can just skip the dispatching process and db query.
         */
        const events = await this.provider.execute();
        const event = events.find(event => {
            return event.eventName === eventName;
        });
        if (!event) {
            return;
        }
        /**
         * Then we go and find all webhooks that are enabled and have the given event in their events list.
         */
        const result = await this.listWebhooksRepository.execute({
            where: {
                enabled: true,
                events_contains: eventName
            }
        });

        if (result.isFail()) {
            return;
        }

        const expiresAt = new Date(
            Date.now() + WEBHOOK_DELIVERY_MAX_RETENTION_DAYS * 24 * 60 * 60 * 1000
        ).toISOString();

        for (const webhook of result.value.items) {
            const deliveryResult = await this.createDeliveryRepository.execute({
                webhookId: webhook.id,
                eventType: event.eventName,
                status: "pending",
                expiresAt,
                payload
            });

            if (deliveryResult.isFail()) {
                continue;
            }

            await this.taskService.trigger<ISendWebhookTaskInput>({
                definition: SEND_WEBHOOK_TASK,
                name: `Webhook: ${webhook.slug} — ${event.eventName}`,
                input: {
                    webhookId: webhook.id,
                    eventName,
                    deliveryId: deliveryResult.value.id
                }
            });
        }
    }
}

export const WebhookDispatcher = WebhookDispatcherAbstraction.createImplementation({
    implementation: WebhookDispatcherImpl,
    dependencies: [
        ListWebhooksRepository,
        CreateWebhookDeliveryRepository,
        TaskService,
        WebhookProvider
    ]
});
