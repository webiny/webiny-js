import { LayoutsRepository } from "../shared/abstractions.js";
import { GetPageLayoutUseCase as UseCaseAbstraction } from "./abstractions.js";

class GetPageLayoutUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: LayoutsRepository.Interface) {}

    execute(layoutId: string, language: string | null) {
        return this.repository.getPageLayout(layoutId, language);
    }
}

export const GetPageLayoutUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetPageLayoutUseCaseImpl,
    dependencies: [LayoutsRepository]
});
