import { createFeature } from "@webiny/feature/admin";
import { SearchContentEntriesUseCase as UseCase } from "./abstractions.js";
import { SearchContentEntriesUseCase } from "./SearchContentEntriesUseCase.js";
import { SearchContentEntriesGateway } from "./SearchContentEntriesGateway.js";

export const SearchContentEntriesFeature = createFeature({
    name: "CmsContentEntry/SearchContentEntries",
    register(container) {
        container.register(SearchContentEntriesUseCase);
        container.register(SearchContentEntriesGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            useCase: container.resolve(UseCase)
        };
    }
});
