import { LayoutsRepository } from "../shared/abstractions.js";
import { GetLayoutRevisionsUseCase as UseCaseAbstraction } from "./abstractions.js";

class GetLayoutRevisionsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: LayoutsRepository.Interface) {}

    execute(entryId: string) {
        return this.repository.getRevisions(entryId);
    }
}

export const GetLayoutRevisionsUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetLayoutRevisionsUseCaseImpl,
    dependencies: [LayoutsRepository]
});
