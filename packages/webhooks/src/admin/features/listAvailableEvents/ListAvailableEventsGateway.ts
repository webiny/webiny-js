import { WebinySdk } from "@webiny/app-admin/features/webinySdk/abstractions.js";
import type { WebhookEvent } from "~/admin/shared/types.js";
import { ListAvailableEventsGateway as GatewayAbstraction } from "./abstractions.js";

class ListAvailableEventsGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private readonly sdk: WebinySdk.Interface) {}

    async execute(): Promise<WebhookEvent[]> {
        const result = await this.sdk.webhooks.listAvailableWebhookEvents();

        if (result.isFail()) {
            throw new Error(result.error.message);
        }

        return result.value;
    }
}

export const ListAvailableEventsGateway = GatewayAbstraction.createImplementation({
    implementation: ListAvailableEventsGatewayImpl,
    dependencies: [WebinySdk]
});
