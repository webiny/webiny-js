import {
    ListWebhooksUseCase as UseCaseAbstraction,
    ListWebhooksGateway,
    type ListWebhooksGatewayParams,
    type ListWebhooksGatewayResult
} from "./abstractions.js";

class ListWebhooksUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: ListWebhooksGateway.Interface) {}

    async execute(params: ListWebhooksGatewayParams): Promise<ListWebhooksGatewayResult> {
        return this.gateway.execute(params);
    }
}

export const ListWebhooksUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListWebhooksUseCaseImpl,
    dependencies: [ListWebhooksGateway]
});
