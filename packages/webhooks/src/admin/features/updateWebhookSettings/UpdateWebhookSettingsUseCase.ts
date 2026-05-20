import type { WebhookSettings } from "~/admin/shared/types.js";
import {
    UpdateWebhookSettingsUseCase as UseCaseAbstraction,
    UpdateWebhookSettingsGateway,
    type UpdateWebhookSettingsInput
} from "./abstractions.js";

class UpdateWebhookSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: UpdateWebhookSettingsGateway.Interface) {}

    async execute(input: UpdateWebhookSettingsInput): Promise<WebhookSettings> {
        return this.gateway.execute(input);
    }
}

export const UpdateWebhookSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: UpdateWebhookSettingsUseCaseImpl,
    dependencies: [UpdateWebhookSettingsGateway]
});
