import type { WebhookSettings } from "~/admin/shared/types.js";
import {
    GetWebhookSettingsUseCase as UseCaseAbstraction,
    GetWebhookSettingsGateway
} from "./abstractions.js";

class GetWebhookSettingsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private readonly gateway: GetWebhookSettingsGateway.Interface) {}

    async execute(): Promise<WebhookSettings> {
        return this.gateway.execute();
    }
}

export const GetWebhookSettingsUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetWebhookSettingsUseCaseImpl,
    dependencies: [GetWebhookSettingsGateway]
});
