import {
    SearchContentEntriesUseCase as UseCaseAbstraction,
    SearchContentEntriesGateway
} from "./abstractions.js";
import type { ISearchContentEntriesUseCaseParams } from "./abstractions.js";

class SearchContentEntriesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private gateway: SearchContentEntriesGateway.Interface) {}

    async execute(params: ISearchContentEntriesUseCaseParams) {
        return this.gateway.execute(params);
    }
}

export const SearchContentEntriesUseCase = UseCaseAbstraction.createImplementation({
    implementation: SearchContentEntriesUseCaseImpl,
    dependencies: [SearchContentEntriesGateway]
});
