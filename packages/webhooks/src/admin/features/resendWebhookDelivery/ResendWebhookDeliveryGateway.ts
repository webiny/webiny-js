import { WebinySdk } from "@webiny/app-admin/features/webinySdk/abstractions.js";
import { ResendWebhookDeliveryGateway as GatewayAbstraction } from "./abstractions.js";

class ResendWebhookDeliveryGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private readonly sdk: WebinySdk.Interface) {}

    async execute(id: string): Promise<boolean> {
        const result = await this.sdk.webhooks.resendWebhookDelivery({ id });

        if (result.isFail()) {
            throw new Error(result.error.message);
        }

        return result.value;
    }
}

export const ResendWebhookDeliveryGateway = GatewayAbstraction.createImplementation({
    implementation: ResendWebhookDeliveryGatewayImpl,
    dependencies: [WebinySdk]
});
