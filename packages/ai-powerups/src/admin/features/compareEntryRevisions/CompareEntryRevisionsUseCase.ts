import {
    CompareEntryRevisionsUseCase as UseCaseAbstraction,
    CompareEntryRevisionsRepository
} from "./abstractions.js";
import type { ICompareEntryRevisionsParams, ICompareEntryRevisionsResult } from "./abstractions.js";

class CompareEntryRevisionsUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: CompareEntryRevisionsRepository.Interface) {}

    async execute(params: ICompareEntryRevisionsParams): Promise<ICompareEntryRevisionsResult> {
        return this.repository.execute(params);
    }
}

export const CompareEntryRevisionsUseCase = UseCaseAbstraction.createImplementation({
    implementation: CompareEntryRevisionsUseCaseImpl,
    dependencies: [CompareEntryRevisionsRepository]
});
