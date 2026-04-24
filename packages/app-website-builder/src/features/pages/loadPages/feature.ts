import { createFeature } from "@webiny/feature/admin";
import {
    LoadPagesUseCase as LoadPagesAbstraction,
    FilterPagesUseCase as FilterPagesAbstraction,
    SearchPagesUseCase as SearchPagesAbstraction,
    SortPagesUseCase as SortPagesAbstraction,
    LoadMorePagesUseCase as LoadMorePagesAbstraction
} from "./abstractions.js";
import { LoadPagesUseCase } from "./LoadPagesUseCase.js";
import { FilterPagesUseCase } from "./FilterPagesUseCase.js";
import { SearchPagesUseCase } from "./SearchPagesUseCase.js";
import { SortPagesUseCase } from "./SortPagesUseCase.js";
import { LoadMorePagesUseCase } from "./LoadMorePagesUseCase.js";
import { ListPagesRepository } from "./ListPagesRepository.js";
import { ListPagesGateway } from "./ListPagesGateway.js";

export const LoadPagesFeature = createFeature({
    name: "WebsiteBuilder/LoadPages",
    register(container) {
        container.register(LoadPagesUseCase);
        container.register(FilterPagesUseCase);
        container.register(SearchPagesUseCase);
        container.register(SortPagesUseCase);
        container.register(LoadMorePagesUseCase);
        container.register(ListPagesRepository).inSingletonScope();
        container.register(ListPagesGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            loadPages: container.resolve(LoadPagesAbstraction),
            filterPages: container.resolve(FilterPagesAbstraction),
            searchPages: container.resolve(SearchPagesAbstraction),
            sortPages: container.resolve(SortPagesAbstraction),
            loadMorePages: container.resolve(LoadMorePagesAbstraction)
        };
    }
});
