import { Result } from "@webiny/feature/api";
import {
    ListWebhooksUseCase as UseCaseAbstraction,
    ListWebhooksRepository
} from "./abstractions.js";
import type { IListWebhooksInput } from "~/api/domain/types.js";

class ListWebhooksUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ListWebhooksRepository.Interface) {}

    async execute(
        input?: IListWebhooksInput
    ): Promise<Result<UseCaseAbstraction.Output, UseCaseAbstraction.Error>> {
        return this.repository.execute(input);
    }
}

export default UseCaseAbstraction.createImplementation({
    implementation: ListWebhooksUseCaseImpl,
    dependencies: [ListWebhooksRepository]
});
