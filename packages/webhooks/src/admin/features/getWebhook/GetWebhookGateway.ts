import { WebinySdk } from "@webiny/app-admin/features/webinySdk/abstractions.js";
import type { Webhook } from "~/admin/shared/types.js";
import { GetWebhookGateway as GatewayAbstraction } from "./abstractions.js";

class GetWebhookGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private readonly sdk: WebinySdk.Interface) {}

    async execute(id: string): Promise<Webhook> {
        const result = await this.sdk.webhooks.getWebhook({ id });

        if (result.isFail()) {
            throw new Error(result.error.message);
        }

        return result.value;
    }
}

export const GetWebhookGateway = GatewayAbstraction.createImplementation({
    implementation: GetWebhookGatewayImpl,
    dependencies: [WebinySdk]
});
