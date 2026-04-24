import { createFeature } from "@webiny/feature/admin";
import {
    loadingRepositoryFactory,
    metaRepositoryFactory,
    sortRepositoryFactory
} from "@webiny/app-utils";
import { pageListCache, fullPageCache } from "~/domain/Page/index.js";
import { pageRevisionsCacheFactory } from "~/domain/PageRevision/index.js";
import { paramsRepositoryFactory } from "~/domain/Params/index.js";
import { searchRepositoryFactory } from "~/domain/Search/index.js";
import { filterRepositoryFactory } from "~/domain/Filter/index.js";
import { selectedItemsRepositoryFactory } from "~/domain/SelectedItem/index.js";
import { QueryStringSearchStateGateway } from "~/features/pages/loadPages/QueryStringSearchStateGateway.js";
import { SearchRepositoryWithQueryStringGateway } from "~/features/pages/loadPages/SearchRepositoryWithQueryStringGateway.js";
import { SortingRepositoryWithDefaults } from "~/domain/Sorting/index.js";
import { Sorting } from "@webiny/app-utils";
import {
    PageListCache,
    FullPageCache,
    PageRevisionsCache,
    WbPageLoadingRepository,
    WbPageRevisionsLoadingRepository,
    WbPageMetaRepository,
    WbPageParamsRepository,
    WbPageSearchRepository,
    WbPageSortingRepository,
    WbPageFilterRepository,
    WbPageSelectedItemsRepository
} from "./abstractions.js";

const WB_PAGE_NAMESPACE = "WbPage";
const WB_PAGE_REVISIONS_NAMESPACE = "WbPageRevisions";

const DEFAULT_SORTING: Sorting[] = [
    {
        field: "savedOn",
        order: "desc"
    }
];

export const SharedPageInfrastructureFeature = createFeature({
    name: "WebsiteBuilder/SharedPageInfrastructure",
    register(container) {
        // Caches
        container.registerInstance(PageListCache, pageListCache);
        container.registerInstance(FullPageCache, fullPageCache);
        container.registerInstance(PageRevisionsCache, pageRevisionsCacheFactory.getCache());

        // Loading repositories
        container.registerInstance(
            WbPageLoadingRepository,
            loadingRepositoryFactory.getRepository(WB_PAGE_NAMESPACE)
        );
        container.registerInstance(
            WbPageRevisionsLoadingRepository,
            loadingRepositoryFactory.getRepository(WB_PAGE_REVISIONS_NAMESPACE)
        );

        // Meta repository
        container.registerInstance(
            WbPageMetaRepository,
            metaRepositoryFactory.getRepository(WB_PAGE_NAMESPACE)
        );

        // Params repository
        container.registerInstance(
            WbPageParamsRepository,
            paramsRepositoryFactory.getRepository(WB_PAGE_NAMESPACE)
        );

        // Search repository (decorated with query string sync)
        container.registerFactory(WbPageSearchRepository, () => {
            const baseSearch = searchRepositoryFactory.getRepository(WB_PAGE_NAMESPACE);
            const qsGateway = new QueryStringSearchStateGateway();
            return new SearchRepositoryWithQueryStringGateway(qsGateway, baseSearch);
        });

        // Sorting repository (with defaults)
        container.registerFactory(WbPageSortingRepository, () => {
            const baseSorting = sortRepositoryFactory.getRepository(WB_PAGE_NAMESPACE);
            return new SortingRepositoryWithDefaults(DEFAULT_SORTING, baseSorting);
        });

        // Filter repository
        container.registerInstance(
            WbPageFilterRepository,
            filterRepositoryFactory.getRepository(WB_PAGE_NAMESPACE)
        );

        // Selected items repository
        container.registerInstance(
            WbPageSelectedItemsRepository,
            selectedItemsRepositoryFactory.getRepository(WB_PAGE_NAMESPACE)
        );
    },
    resolve() {
        return {};
    }
});
