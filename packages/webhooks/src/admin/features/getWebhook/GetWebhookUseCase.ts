import type { Webhook } from "~/admin/shared/types.js";
import {
    GetWebhookUseCase as UseCaseAbstraction,
    GetWebhookGateway
} from "./abstractions.js";

class GetWebhookUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: GetWebhookGateway.Interface) {}

    async execute(id: string): Promise<Webhook> {
        return this.gateway.execute(id);
    }
}

export const GetWebhookUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetWebhookUseCaseImpl,
    dependencies: [GetWebhookGateway]
});
