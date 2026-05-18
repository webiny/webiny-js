import {
    ResendWebhookDeliveryGateway,
    ResendWebhookDeliveryUseCase as UseCaseAbstraction
} from "./abstractions.js";

class ResendWebhookDeliveryUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: ResendWebhookDeliveryGateway.Interface) {}

    async execute(id: string): Promise<boolean> {
        return this.gateway.execute(id);
    }
}

export const ResendWebhookDeliveryUseCase = UseCaseAbstraction.createImplementation({
    implementation: ResendWebhookDeliveryUseCaseImpl,
    dependencies: [ResendWebhookDeliveryGateway]
});
