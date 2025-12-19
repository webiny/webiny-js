import {
    GetPageRevisionsUseCase as UseCaseAbstraction,
    GetPageRevisionsRepository
} from "./abstractions.js";

class GetPageRevisionsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetPageRevisionsRepository.Interface) {}

    async execute(entryId: string): UseCaseAbstraction.Return {
        return this.repository.execute(entryId);
    }
}

export const GetPageRevisionsUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetPageRevisionsUseCaseImpl,
    dependencies: [GetPageRevisionsRepository]
});
