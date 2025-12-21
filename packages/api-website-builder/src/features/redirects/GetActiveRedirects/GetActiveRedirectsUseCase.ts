import { createImplementation } from "@webiny/feature/api";
import {
    GetActiveRedirectsUseCase as UseCaseAbstraction,
    GetActiveRedirectsRepository
} from "./abstractions.js";

class GetActiveRedirectsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetActiveRedirectsRepository.Interface) {}

    async execute(): UseCaseAbstraction.Return {
        return await this.repository.execute();
    }
}

export const GetActiveRedirectsUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: GetActiveRedirectsUseCaseImpl,
    dependencies: [GetActiveRedirectsRepository]
});
