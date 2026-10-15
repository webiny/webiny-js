import {
    GetContentEntriesUseCase,
    type IGetContentEntriesUseCaseParams
} from "../getContentEntries/abstractions.js";
import {
    SearchContentEntriesUseCase,
    type ISearchContentEntriesUseCaseParams
} from "../searchContentEntries/abstractions.js";
import { ReferenceTitles } from "./abstractions.js";

// The reference inputs already load the entries they show. Keeping those titles means an
// accordion title picks up a newly selected reference without a request of its own.

class RememberResolvedTitles implements GetContentEntriesUseCase.Interface {
    constructor(
        private titles: ReferenceTitles.Interface,
        private decoratee: GetContentEntriesUseCase.Interface
    ) {}

    async execute(params: IGetContentEntriesUseCaseParams) {
        const result = await this.decoratee.execute(params);
        this.titles.remember(result.latest);
        return result;
    }
}

class RememberSearchedTitles implements SearchContentEntriesUseCase.Interface {
    constructor(
        private titles: ReferenceTitles.Interface,
        private decoratee: SearchContentEntriesUseCase.Interface
    ) {}

    async execute(params: ISearchContentEntriesUseCaseParams) {
        const result = await this.decoratee.execute(params);
        this.titles.remember(result.data);
        return result;
    }
}

export const RememberResolvedTitlesDecorator = GetContentEntriesUseCase.createDecorator({
    decorator: RememberResolvedTitles,
    dependencies: [ReferenceTitles]
});

export const RememberSearchedTitlesDecorator = SearchContentEntriesUseCase.createDecorator({
    decorator: RememberSearchedTitles,
    dependencies: [ReferenceTitles]
});
