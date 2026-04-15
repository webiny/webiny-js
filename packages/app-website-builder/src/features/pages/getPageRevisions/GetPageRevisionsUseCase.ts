import {
    GetPageRevisionsUseCase as UseCaseAbstraction,
    GetPageRevisionsRepository
} from "./abstractions.js";

class GetPageRevisionsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: GetPageRevisionsRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params) {
        return await this.repository.execute(params.entryId);
    }
}

export const GetPageRevisionsUseCase = UseCaseAbstraction.createImplementation({
    implementation: GetPageRevisionsUseCaseImpl,
    dependencies: [GetPageRevisionsRepository]
});
