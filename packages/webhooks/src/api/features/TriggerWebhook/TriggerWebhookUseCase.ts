import { Result } from "@webiny/feature/api";
import { TriggerWebhookUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetWebhookRepository } from "~/api/features/GetWebhook/abstractions.js";
import { CreateWebhookDeliveryRepository } from "~/api/features/CreateWebhookDelivery/abstractions.js";
import { WebhookSignPayload } from "@webiny/api-core/features/webhooks/index.js";
import { TenantContext } from "@webiny/api-core/exports/api/tenancy.js";
import { WEBHOOK_DELIVERY_RETENTION_DAYS } from "~/api/domain/constants.js";
import type { IWebhookDelivery, IWebhookPayload } from "~/api/domain/types.js";

class TriggerWebhookUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(
        private getWebhookRepository: GetWebhookRepository.Interface,
        private createDeliveryRepository: CreateWebhookDeliveryRepository.Interface,
        private signPayload: WebhookSignPayload.Interface,
        private tenantContext: TenantContext.Interface
    ) {}

    async execute(
        webhookId: string,
        data: Record<string, unknown>
    ): Promise<Result<IWebhookDelivery, UseCaseAbstraction.Error>> {
        const webhookResult = await this.getWebhookRepository.execute(webhookId);
        if (webhookResult.isFail()) {
            return Result.fail(webhookResult.error);
        }
        const webhook = webhookResult.value;

        const triggerId = crypto.randomUUID();
        const now = new Date();
        const webhookPayload: IWebhookPayload = {
            id: triggerId,
            event: "webhook.test",
            timestamp: now.toISOString(),
            webhookId,
            tenant: this.tenantContext.getTenant().id,
            data
        };
        const rawBody = JSON.stringify(webhookPayload);
        const signHeaders = await this.signPayload.sign(
            triggerId,
            now,
            rawBody,
            webhook.values.signingSecret
        );

        const requestHeaders: Record<string, string> = {
            "Content-Type": "application/json",
            ...signHeaders
        };

        const startTime = Date.now();
        let responseStatus = 0;
        let responseBody = "";

        try {
            const response = await fetch(webhook.values.endpointUrl, {
                method: "POST",
                headers: requestHeaders,
                body: rawBody,
                signal: AbortSignal.timeout(30_000)
            });
            responseStatus = response.status;
            responseBody = await response.text();
        } catch (error) {
            responseStatus = 0;
            responseBody = (error as Error).message;
        }

        const responseTime = Date.now() - startTime;
        const expiresAt = new Date(
            Date.now() + WEBHOOK_DELIVERY_RETENTION_DAYS * 24 * 60 * 60 * 1000
        ).toISOString();

        return this.createDeliveryRepository.execute({
            webhookId,
            backgroundTaskId: triggerId,
            eventType: "webhook.test",
            payload: webhookPayload,
            requestHeaders,
            responseTime,
            responseStatus,
            responseBody,
            expiresAt
        });
    }
}

export default UseCaseAbstraction.createImplementation({
    implementation: TriggerWebhookUseCaseImpl,
    dependencies: [
        GetWebhookRepository,
        CreateWebhookDeliveryRepository,
        WebhookSignPayload,
        TenantContext
    ]
});
