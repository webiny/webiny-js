import {
    ListRevisionsUseCase as UseCaseAbstraction,
    ListRevisionsRepository
} from "./abstractions.js";
import type { IListRevisionsParams } from "./abstractions.js";

class ListRevisionsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ListRevisionsRepository.Interface) {}

    async execute(params: IListRevisionsParams) {
        return this.repository.execute(params);
    }
}

export const ListRevisionsUseCase = UseCaseAbstraction.createImplementation({
    implementation: ListRevisionsUseCaseImpl,
    dependencies: [ListRevisionsRepository]
});
