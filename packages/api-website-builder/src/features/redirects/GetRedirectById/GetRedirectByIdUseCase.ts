import { createImplementation } from "@webiny/feature/api";
import {
    GetRedirectByIdUseCase as UseCaseAbstraction,
    GetRedirectByIdRepository
} from "./abstractions.js";

class GetRedirectByIdUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetRedirectByIdRepository.Interface) {}

    async execute(id: string): UseCaseAbstraction.Return {
        return await this.repository.execute(id);
    }
}

export const GetRedirectByIdUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: GetRedirectByIdUseCaseImpl,
    dependencies: [GetRedirectByIdRepository]
});
