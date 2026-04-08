import { createImplementation } from "@webiny/feature/api";
import {
    GetLanguageByCodeUseCase as UseCaseAbstraction,
    GetLanguageByCodeRepository
} from "./abstractions.js";

class GetLanguageByCodeUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetLanguageByCodeRepository.Interface) {}

    async execute(code: string): UseCaseAbstraction.Return {
        return this.repository.execute(code);
    }
}

export const GetLanguageByCodeUseCase = createImplementation({
    abstraction: UseCaseAbstraction,
    implementation: GetLanguageByCodeUseCaseImpl,
    dependencies: [GetLanguageByCodeRepository]
});
