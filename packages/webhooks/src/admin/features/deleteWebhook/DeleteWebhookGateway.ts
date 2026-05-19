import { WebinySdk } from "@webiny/app-admin/features/webinySdk/abstractions.js";
import { DeleteWebhookGateway as GatewayAbstraction } from "./abstractions.js";

class DeleteWebhookGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private readonly sdk: WebinySdk.Interface) {}

    async execute(id: string): Promise<boolean> {
        const result = await this.sdk.webhooks.deleteWebhook({ id });

        if (result.isFail()) {
            throw new Error(result.error.message);
        }

        return result.value;
    }
}

export const DeleteWebhookGateway = GatewayAbstraction.createImplementation({
    implementation: DeleteWebhookGatewayImpl,
    dependencies: [WebinySdk]
});
