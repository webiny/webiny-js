import {
    ListWebhooksRepository,
    ListWebhooksUseCase as UseCaseAbstraction
} from "./abstractions.js";
import type { IListWebhooksInput, IListWebhooksOutput } from "~/admin/domain/types.js";

class ListWebhooksUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ListWebhooksRepository.Interface) {}

    async execute(input: IListWebhooksInput): Promise<IListWebhooksOutput> {
        return this.repository.execute(input);
    }
}

export const ListWebhooksUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListWebhooksUseCaseImpl,
    dependencies: [ListWebhooksRepository]
});
