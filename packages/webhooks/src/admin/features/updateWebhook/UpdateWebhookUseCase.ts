import type { Webhook } from "~/admin/shared/types.js";
import {
    UpdateWebhookUseCase as UseCaseAbstraction,
    UpdateWebhookGateway,
    type UpdateWebhookInput
} from "./abstractions.js";

class UpdateWebhookUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: UpdateWebhookGateway.Interface) {}

    async execute(id: string, input: UpdateWebhookInput): Promise<Webhook> {
        return this.gateway.execute(id, input);
    }
}

export const UpdateWebhookUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateWebhookUseCaseImpl,
    dependencies: [UpdateWebhookGateway]
});
