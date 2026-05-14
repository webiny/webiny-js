import { Result } from "@webiny/feature/api";
import { TriggerWebhookUseCase as UseCaseAbstraction } from "./abstractions.js";
import { GetWebhookRepository } from "~/api/features/GetWebhook/abstractions.js";
import { CreateWebhookDeliveryRepository } from "~/api/features/CreateWebhookDelivery/abstractions.js";
import { WebhookSignPayload } from "@webiny/api-core/features/webhooks/index.js";
import { TenantContext } from "@webiny/api-core/exports/api/tenancy.js";
import { WEBHOOK_DELIVERY_RETENTION_DAYS } from "~/api/domain/constants.js";
import type { WebhookDelivery } from "~/api/domain/WebhookDelivery.js";
import type { IWebhookPayload } from "~/api/features/SendWebhookTask/types.js";

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
    ): Promise<Result<WebhookDelivery, UseCaseAbstraction.Error>> {
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
            webhook.signingSecret ?? ""
        );

        const requestHeaders: Record<string, string> = {
            "Content-Type": "application/json",
            ...signHeaders
        };

        let responseStatus = 0;

        try {
            const response = await fetch(webhook.endpointUrl, {
                method: "POST",
                headers: requestHeaders,
                body: rawBody,
                signal: AbortSignal.timeout(30_000)
            });
            responseStatus = response.status;
        } catch {
            responseStatus = 0;
        }

        const expiresAt = new Date(
            Date.now() + WEBHOOK_DELIVERY_RETENTION_DAYS * 24 * 60 * 60 * 1000
        ).toISOString();

        return this.createDeliveryRepository.execute({
            webhookId,
            eventType: "webhook.test",
            status: responseStatus > 0 ? "delivered" : "failed",
            payload: webhookPayload,
            expiresAt
        });
    }
}

export const TriggerWebhookUseCase = UseCaseAbstraction.createImplementation({
    implementation: TriggerWebhookUseCaseImpl,
    dependencies: [
        GetWebhookRepository,
        CreateWebhookDeliveryRepository,
        WebhookSignPayload,
        TenantContext
    ]
});
