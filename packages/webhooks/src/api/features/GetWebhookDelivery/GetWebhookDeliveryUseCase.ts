import { type Result } from "@webiny/feature/api";
import {
    GetWebhookDeliveryUseCase as UseCaseAbstraction,
    GetWebhookDeliveryRepository
} from "./abstractions.js";
import type { IWebhookDelivery } from "~/api/domain/types.js";

class GetWebhookDeliveryUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetWebhookDeliveryRepository.Interface) {}

    async execute(id: string): Promise<Result<IWebhookDelivery, UseCaseAbstraction.Error>> {
        return this.repository.execute(id);
    }
}

export default UseCaseAbstraction.createImplementation({
    implementation: GetWebhookDeliveryUseCaseImpl,
    dependencies: [GetWebhookDeliveryRepository]
});
