import { WebinySdk } from "@webiny/app-admin/features/webinySdk/abstractions.js";
import {
    ListWebhookDeliveriesGateway as GatewayAbstraction,
    type ListWebhookDeliveriesParams,
    type ListWebhookDeliveriesResult
} from "./abstractions.js";

class ListWebhookDeliveriesGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private readonly sdk: WebinySdk.Interface) {}

    async execute(params: ListWebhookDeliveriesParams): Promise<ListWebhookDeliveriesResult> {
        const result = await this.sdk.webhooks.listWebhookDeliveries({
            where: params.where,
            limit: params.limit,
            after: params.after
        });

        if (result.isFail()) {
            throw new Error(result.error.message);
        }

        return {
            data: result.value.data,
            meta: result.value.meta
        };
    }
}

export const ListWebhookDeliveriesGateway = GatewayAbstraction.createImplementation({
    implementation: ListWebhookDeliveriesGatewayImpl,
    dependencies: [WebinySdk]
});
