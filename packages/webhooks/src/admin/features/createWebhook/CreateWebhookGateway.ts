import { WebinySdk } from "@webiny/app-admin/features/webinySdk/abstractions.js";
import type { Webhook } from "~/admin/shared/types.js";
import { CreateWebhookGateway as GatewayAbstraction, type CreateWebhookInput } from "./abstractions.js";

class CreateWebhookGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private readonly sdk: WebinySdk.Interface) {}

    async execute(input: CreateWebhookInput): Promise<Webhook> {
        const result = await this.sdk.webhooks.createWebhook(input);

        if (result.isFail()) {
            throw new Error(result.error.message);
        }

        return result.value;
    }
}

export const CreateWebhookGateway = GatewayAbstraction.createImplementation({
    implementation: CreateWebhookGatewayImpl,
    dependencies: [WebinySdk]
});
