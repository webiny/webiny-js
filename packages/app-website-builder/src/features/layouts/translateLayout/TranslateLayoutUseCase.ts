import { LayoutsRepository } from "../shared/abstractions.js";
import { TranslateLayoutUseCase as UseCaseAbstraction } from "./abstractions.js";

class TranslateLayoutUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: LayoutsRepository.Interface) {}

    execute(id: string, language: string) {
        return this.repository.translate(id, language);
    }
}

export const TranslateLayoutUseCase = UseCaseAbstraction.createImplementation({
    implementation: TranslateLayoutUseCaseImpl,
    dependencies: [LayoutsRepository]
});
