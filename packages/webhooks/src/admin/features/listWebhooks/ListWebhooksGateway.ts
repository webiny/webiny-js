import { WebinySdk } from "@webiny/app-admin/features/webinySdk/abstractions.js";
import {
    ListWebhooksGateway as GatewayAbstraction,
    type ListWebhooksGatewayParams,
    type ListWebhooksGatewayResult
} from "./abstractions.js";

class ListWebhooksGatewayImpl implements GatewayAbstraction.Interface {
    constructor(private readonly sdk: WebinySdk.Interface) {}

    async execute(params: ListWebhooksGatewayParams): Promise<ListWebhooksGatewayResult> {
        const result = await this.sdk.webhooks.listWebhooks({
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

export const ListWebhooksGateway = GatewayAbstraction.createImplementation({
    implementation: ListWebhooksGatewayImpl,
    dependencies: [WebinySdk]
});
