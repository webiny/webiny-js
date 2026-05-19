import "@webiny/tasks/types.js";
import { TaskDefinition } from "@webiny/api-core/exports/api/tasks.js";
import { TenantContext } from "@webiny/api-core/exports/api/tenancy.js";
import { WebhookSignPayload } from "@webiny/api-core/features/webhooks/index.js";
import { GetWebhookRepository } from "~/api/features/GetWebhook/abstractions.js";
import { GetWebhookDeliveryRepository } from "~/api/features/GetWebhookDelivery/abstractions.js";
import { UpdateWebhookDeliveryRepository } from "~/api/features/UpdateWebhookDelivery/abstractions.js";
import { GetWebhookSettingsRepository } from "~/api/features/GetWebhookSettings/abstractions.js";
import { SEND_WEBHOOK_TASK } from "~/api/domain/constants.js";
import type { ISendWebhookTaskInput, ISendWebhookTaskOutput, IWebhookPayload } from "./types.js";
import type { IWebhookSignPayloadHeaders } from "@webiny/api-core/features/webhooks/WebhookSignPayload/abstractions.js";

type IRunParams = TaskDefinition.RunParams<ISendWebhookTaskInput, ISendWebhookTaskOutput>;

class SendWebhookTaskDefinition implements TaskDefinition.Interface<
    ISendWebhookTaskInput,
    ISendWebhookTaskOutput
> {
    public readonly id = SEND_WEBHOOK_TASK;
    public readonly title = "Send Webhook";
    public readonly maxIterations = 1;
    public readonly isPrivate = true;
    public readonly databaseLogs = false;
    public readonly description =
        "POST a signed event payload to a webhook endpoint and log the delivery.";
    public readonly selfCleanup = ["onSuccess" as const, "onAbort" as const];

    public constructor(
        private readonly getWebhookRepository: GetWebhookRepository.Interface,
        private readonly getWebhookDeliveryRepository: GetWebhookDeliveryRepository.Interface,
        private readonly updateDeliveryRepository: UpdateWebhookDeliveryRepository.Interface,
        private readonly signPayload: WebhookSignPayload.Interface,
        private readonly tenantContext: TenantContext.Interface,
        private readonly getWebhookSettingsRepository: GetWebhookSettingsRepository.Interface
    ) {}

    public async run(params: IRunParams) {
        const { input, controller } = params;
        const taskId = controller.state.getTask().id;

        const delivery = await this.getWebhookDeliveryRepository.execute(input.deliveryId);
        if (delivery.isFail()) {
            return controller.response.error(delivery.error);
        }

        await this.updateDeliveryRepository.execute(input.deliveryId, {
            backgroundTaskId: taskId,
            status: "delivering"
        });

        const webhookResult = await this.getWebhookRepository.execute(input.webhookId);
        if (webhookResult.isFail()) {
            await this.updateDeliveryRepository.execute(input.deliveryId, { status: "failed" });
            return controller.response.error(webhookResult.error);
        }
        const webhook = webhookResult.value;

        const now = new Date();
        const payload: IWebhookPayload = {
            id: taskId,
            event: input.eventName,
            timestamp: now.toISOString(),
            webhookId: input.webhookId,
            deliveryId: input.deliveryId,
            tenant: this.tenantContext.getTenant().id,
            data: delivery.value.payload
        };
        const rawBody = JSON.stringify(payload);
        let signHeaders: IWebhookSignPayloadHeaders;

        const settingsResult = await this.getWebhookSettingsRepository.execute();
        if (settingsResult.isFail()) {
            await this.updateDeliveryRepository.execute(input.deliveryId, { status: "failed" });
            return controller.response.error(settingsResult.error);
        }
        const signingSecret = webhook.signingSecret || settingsResult.value.signingSecret || "";

        try {
            signHeaders = await this.signPayload.sign(taskId, now, rawBody, signingSecret);
        } catch (ex) {
            await this.updateDeliveryRepository.execute(input.deliveryId, { status: "failed" });
            return controller.response.error(
                ex instanceof Error ? ex : new Error("Unknown error during payload signing.")
            );
        }

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
            status: responseSittatus > 0 ? "delivered" : "failed"
        });

        return controller.response.done();
    }
}

export const SendWebhookTask = TaskDefinition.createImplementation({
    implementation: SendWebhookTaskDefinition,
    dependencies: [
        GetWebhookRepository,
        GetWebhookDeliveryRepository,
        UpdateWebhookDeliveryRepository,
        WebhookSignPayload,
        TenantContext,
        GetWebhookSettingsRepository
    ]
});
