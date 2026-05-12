import { Result } from "@webiny/feature/api";
import {
    ListWebhookDeliveriesUseCase as UseCaseAbstraction,
    ListWebhookDeliveriesRepository
} from "./abstractions.js";
import type { IListWebhookDeliveriesInput } from "~/api/domain/types.js";

class ListWebhookDeliveriesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ListWebhookDeliveriesRepository.Interface) {}

    async execute(
        input: IListWebhookDeliveriesInput
    ): Promise<Result<UseCaseAbstraction.Output, UseCaseAbstraction.Error>> {
        return this.repository.execute(input);
    }
}

export default UseCaseAbstraction.createImplementation({
    implementation: ListWebhookDeliveriesUseCaseImpl,
    dependencies: [ListWebhookDeliveriesRepository]
});
