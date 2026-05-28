import type { WebhookDelivery } from "~/admin/shared/types.js";
import {
    TriggerWebhookGateway,
    TriggerWebhookUseCase as UseCaseAbstraction
} from "./abstractions.js";

class TriggerWebhookUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: TriggerWebhookGateway.Interface) {}

    async execute(id: string, payload: Record<string, unknown>): Promise<WebhookDelivery> {
        return this.gateway.execute(id, payload);
    }
}

export const TriggerWebhookUseCase = UseCaseAbstraction.createImplementation({
    implementation: TriggerWebhookUseCaseImpl,
    dependencies: [TriggerWebhookGateway]
});
