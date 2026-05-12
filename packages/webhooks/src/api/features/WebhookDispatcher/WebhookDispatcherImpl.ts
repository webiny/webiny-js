import { WebhookDispatcher } from "@webiny/api-core/features/webhooks/index.js";
import { TaskService } from "@webiny/api-core/exports/api/tasks.js";
import { ListWebhooksRepository } from "~/api/features/ListWebhooks/abstractions.js";
import { SEND_WEBHOOK_TASK } from "~/api/domain/constants.js";

class WebhookDispatcherImpl implements WebhookDispatcher.Interface {
    constructor(
        private listWebhooksRepository: ListWebhooksRepository.Interface,
        private taskService: TaskService.Interface
    ) {}

    async dispatch(eventName: string, data: object): Promise<void> {
        const result = await this.listWebhooksRepository.execute({
            where: { enabled: true, events: eventName }
        });

        if (result.isFail()) {
            return;
        }

        for (const webhook of result.value.items) {
            await this.taskService.trigger({
                definition: SEND_WEBHOOK_TASK,
                name: `Send webhook: ${webhook.values.slug} — ${eventName}`,
                input: {
                    webhookId: webhook.id,
                    eventName,
                    data
                }
            });
        }
    }
}

export default WebhookDispatcher.createImplementation({
    implementation: WebhookDispatcherImpl,
    dependencies: [ListWebhooksRepository, TaskService]
});
