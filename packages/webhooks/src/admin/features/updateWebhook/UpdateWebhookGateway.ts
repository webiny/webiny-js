import { WebinySdk } from "@webiny/app-admin/features/webinySdk/abstractions.js";
import type { Webhook } from "~/admin/shared/types.js";
import {
    UpdateWebhookGateway as GatewayAbstraction,
    type UpdateWebhookInput
} from "./abstractions.js";

class UpdateWebhookGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private readonly sdk: WebinySdk.Interface) {}

    async execute(id: string, input: UpdateWebhookInput): Promise<Webhook> {
        const result = await this.sdk.webhooks.updateWebhook({ id, ...input });

        if (result.isFail()) {
            throw new Error(result.error.message);
        }

        return result.value;
    }
}

export const UpdateWebhookGateway = GatewayAbstraction.createImplementation({
    implementation: UpdateWebhookGatewayImpl,
    dependencies: [WebinySdk]
});
