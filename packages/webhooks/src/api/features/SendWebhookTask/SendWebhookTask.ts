import "@webiny/tasks/types.js";
import { TaskDefinition } from "@webiny/api-core/exports/api/tasks.js";
import { TenantContext } from "@webiny/api-core/exports/api/tenancy.js";
import { WebhookSignPayload } from "@webiny/api-core/features/webhooks/index.js";
import { GetWebhookRepository } from "~/api/features/GetWebhook/abstractions.js";
import { UpdateWebhookDeliveryRepository } from "~/api/features/UpdateWebhookDelivery/abstractions.js";
import { SEND_WEBHOOK_TASK } from "~/api/domain/constants.js";
import type { ISendWebhookTaskInput, ISendWebhookTaskOutput } from "./types.js";
import type { IWebhookPayload } from "~/api/domain/types.js";

type IRunParams = TaskDefinition.RunParams<ISendWebhookTaskInput, ISendWebhookTaskOutput>;

class SendWebhookTaskDefinition implements TaskDefinition.Interface<
    ISendWebhookTaskInput,
    ISendWebhookTaskOutput
> {
    id = SEND_WEBHOOK_TASK;
    title = "Send Webhook";
    maxIterations = 1;
    isPrivate = true;
    databaseLogs = false;
    description = "POST a signed event payload to a webhook endpoint and log the delivery.";

    constructor(
        private getWebhookRepository: GetWebhookRepository.Interface,
        private updateDeliveryRepository: UpdateWebhookDeliveryRepository.Interface,
        private signPayload: WebhookSignPayload.Interface,
        private tenantContext: TenantContext.Interface
    ) {}

    async run(params: IRunParams) {
        const { input } = params;
        const taskId = params.controller.state.getTask().id;

        await this.updateDeliveryRepository.execute(input.deliveryId, {
            backgroundTaskId: taskId,
            status: "delivering"
        });

        const webhookResult = await this.getWebhookRepository.execute(input.webhookId);
        if (webhookResult.isFail()) {
            await this.updateDeliveryRepository.execute(input.deliveryId, { status: "failed" });
            return params.controller.response.error(webhookResult.error);
        }
        const webhook = webhookResult.value;

        const now = new Date();
        const payload: IWebhookPayload = {
            id: taskId,
            event: input.eventName,
            timestamp: now.toISOString(),
            webhookId: input.webhookId,
            tenant: this.tenantContext.getTenant().id,
            data: input.data
        };
        const rawBody = JSON.stringify(payload);
        const signHeaders = await this.signPayload.sign(
            taskId,
            now,
            rawBody,
            webhook.signingSecret ?? ""
        );

        const requestHeaders: Record<string, string> = {
            "Content-Type": "application/json",
            ...signHeaders
        };

        const startTime = Date.now();
        let responseStatus = 0;
        let responseBody = "";

        try {
            const response = await fetch(webhook.endpointUrl, {
                method: "POST",
                headers: requestHeaders,
                body: rawBody,
                signal: AbortSignal.timeout(600_000)
            });
            responseStatus = response.status;
            responseBody = await response.text();
        } catch (error) {
            responseStatus = 0;
            responseBody = (error as Error).message;
        }

        const responseTime = Date.now() - startTime;

        await this.updateDeliveryRepository.execute(input.deliveryId, {
            payload,
            requestHeaders,
            responseTime,
            responseStatus,
            responseBody,
            status: responseStatus > 0 ? "delivered" : "failed"
        });

        return params.controller.response.done();
    }

    createInputValidation({ validator }: TaskDefinition.CreateInputValidationParams) {
        return {
            webhookId: validator.string(),
            eventName: validator.string(),
            deliveryId: validator.string(),
            data: validator.record(validator.string(), validator.unknown()).optional()
        };
    }
}

export const SendWebhookTask = TaskDefinition.createImplementation({
    implementation: SendWebhookTaskDefinition,
    dependencies: [
        GetWebhookRepository,
        UpdateWebhookDeliveryRepository,
        WebhookSignPayload,
        TenantContext
    ]
});
