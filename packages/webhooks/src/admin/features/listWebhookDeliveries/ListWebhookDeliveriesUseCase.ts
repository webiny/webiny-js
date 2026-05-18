import {
    ListWebhookDeliveriesGateway,
    ListWebhookDeliveriesUseCase as UseCaseAbstraction,
    type ListWebhookDeliveriesParams,
    type ListWebhookDeliveriesResult
} from "./abstractions.js";

class ListWebhookDeliveriesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: ListWebhookDeliveriesGateway.Interface) {}

    async execute(params: ListWebhookDeliveriesParams): Promise<ListWebhookDeliveriesResult> {
        return this.gateway.execute(params);
    }
}

export const ListWebhookDeliveriesUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListWebhookDeliveriesUseCaseImpl,
    dependencies: [ListWebhookDeliveriesGateway]
});
