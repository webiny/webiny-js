import type { Webhook } from "~/admin/shared/types.js";
import {
    CreateWebhookUseCase as UseCaseAbstraction,
    CreateWebhookGateway,
    type CreateWebhookInput
} from "./abstractions.js";

class CreateWebhookUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: CreateWebhookGateway.Interface) {}

    async execute(input: CreateWebhookInput): Promise<Webhook> {
        return this.gateway.execute(input);
    }
}

export const CreateWebhookUseCase = UseCaseAbstraction.createImplementation({
    implementation: CreateWebhookUseCaseImpl,
    dependencies: [CreateWebhookGateway]
});
