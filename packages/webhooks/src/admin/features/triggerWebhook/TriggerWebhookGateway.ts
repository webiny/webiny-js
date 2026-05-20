import { WebinySdk } from "@webiny/app-admin/features/webinySdk/abstractions.js";
import type { WebhookDelivery } from "~/admin/shared/types.js";
import { TriggerWebhookGateway as GatewayAbstraction } from "./abstractions.js";

class TriggerWebhookGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private readonly sdk: WebinySdk.Interface) {}

    async execute(id: string, payload: Record<string, unknown>): Promise<WebhookDelivery> {
        const result = await this.sdk.webhooks.triggerWebhook({ id, payload });

        if (result.isFail()) {
            throw new Error(result.error.message);
        }

        return result.value;
    }
}

export const TriggerWebhookGateway = GatewayAbstraction.createImplementation({
    implementation: TriggerWebhookGatewayImpl,
    dependencies: [WebinySdk]
});
