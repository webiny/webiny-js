import {
    CompareEntryRevisionsRepository as RepositoryAbstraction,
    CompareEntryRevisionsGateway
} from "./abstractions.js";
import type { ICompareEntryRevisionsParams, ICompareEntryRevisionsResult } from "./abstractions.js";

class CompareEntryRevisionsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private gateway: CompareEntryRevisionsGateway.Interface) {}

    async execute(params: ICompareEntryRevisionsParams): Promise<ICompareEntryRevisionsResult> {
        return this.gateway.execute(params);
    }
}

export const CompareEntryRevisionsRepository = RepositoryAbstraction.createImplementation({
    implementation: CompareEntryRevisionsRepositoryImpl,
    dependencies: [CompareEntryRevisionsGateway]
});
