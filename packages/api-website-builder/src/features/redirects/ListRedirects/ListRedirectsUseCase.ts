import { createImplementation } from "@webiny/feature/api";
import {
    ListRedirectsUseCase as UseCaseAbstraction,
    ListRedirectsRepository
} from "./abstractions.js";

class ListRedirectsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ListRedirectsRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params): UseCaseAbstraction.Return {
        return await this.repository.execute(params);
    }
}

export const ListRedirectsUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: ListRedirectsUseCaseImpl,
    dependencies: [ListRedirectsRepository]
});
