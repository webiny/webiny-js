import { createFeature } from "@webiny/feature/admin/index.js";
import {
    ListQueryParamsRepository as QueryParamsAbstraction,
    LoadingRepository as LoadingAbstraction,
    SearchFeature as SearchAbstraction,
    FilterFeature as FilterAbstraction,
    SortFeature as SortAbstraction,
    LoadMoreFeature as LoadMoreAbstraction
} from "./abstractions.js";
import { ListQueryParamsRepository } from "./ListQueryParamsRepository.js";
import { LoadingRepository } from "./LoadingRepository.js";
import { SearchFeature } from "./SearchFeature.js";
import { FilterFeature } from "./FilterFeature.js";
import { SortFeature } from "./SortFeature.js";
import { LoadMoreFeature } from "./LoadMoreFeature.js";

export const ListFeature = createFeature({
    name: "ListFeature",
    register: container => {
        // Register infrastructure
        container.register(ListQueryParamsRepository);
        container.register(LoadingRepository);

        // Register features
        container.register(SearchFeature);
        container.register(FilterFeature);
        container.register(SortFeature);
        container.register(LoadMoreFeature);
    },
    resolve: container => {
        return {
            queryParams: container.resolve(QueryParamsAbstraction),
            loading: container.resolve(LoadingAbstraction),
            search: container.resolve(SearchAbstraction),
            filter: container.resolve(FilterAbstraction),
            sort: container.resolve(SortAbstraction),
            loadMore: container.resolve(LoadMoreAbstraction)
        };
    }
});
