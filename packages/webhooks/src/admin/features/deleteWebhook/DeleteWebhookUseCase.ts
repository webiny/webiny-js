import {
    DeleteWebhookUseCase as UseCaseAbstraction,
    DeleteWebhookGateway
} from "./abstractions.js";

class DeleteWebhookUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: DeleteWebhookGateway.Interface) {}

    async execute(id: string): Promise<boolean> {
        return this.gateway.execute(id);
    }
}

export const DeleteWebhookUseCase = UseCaseAbstraction.createImplementation({
    implementation: DeleteWebhookUseCaseImpl,
    dependencies: [DeleteWebhookGateway]
});
