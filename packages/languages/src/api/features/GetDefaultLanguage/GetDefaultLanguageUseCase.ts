import { createImplementation } from "@webiny/feature/api";
import {
    GetDefaultLanguageUseCase as UseCaseAbstraction,
    GetDefaultLanguageRepository
} from "./abstractions.js";

class GetDefaultLanguageUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetDefaultLanguageRepository.Interface) {}

    async execute(): UseCaseAbstraction.Return {
        return this.repository.execute();
    }
}

export const GetDefaultLanguageUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: GetDefaultLanguageUseCaseImpl,
    dependencies: [GetDefaultLanguageRepository]
});
