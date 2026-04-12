import { createAbstraction } from "@webiny/feature/admin";
import type { ILoadingRepository, IMetaRepository, ISortingRepository } from "@webiny/app-utils";
import type { IListCache } from "~/shared/cache/IListCache.js";
import type { IListCache as IRevisionListCache } from "~/domain/PageRevision/ListCache.js";
import type { Page } from "~/domain/Page/Page.js";
import type { PageRevision } from "~/domain/PageRevision/PageRevision.js";
import type { ISearchRepository } from "~/domain/Search/ISearchRepository.js";
import type { IFilterRepository } from "~/domain/Filter/IFilterRepository.js";
import type { IParamsRepository } from "~/domain/Params/IParamsRepository.js";
import type { ISelectedItemsRepository } from "~/domain/SelectedItem/ISelectedItemsRepository.js";

// Page caches
export const PageListCache = createAbstraction<IListCache<Page>>("WebsiteBuilder/PageListCache");
export namespace PageListCache {
    export type Interface = IListCache<Page>;
}

export const FullPageCache = createAbstraction<IListCache<Page>>("WebsiteBuilder/FullPageCache");
export namespace FullPageCache {
    export type Interface = IListCache<Page>;
}

// Page revision cache
export const PageRevisionsCache = createAbstraction<IRevisionListCache<PageRevision>>(
    "WebsiteBuilder/PageRevisionsCache"
);
export namespace PageRevisionsCache {
    export type Interface = IRevisionListCache<PageRevision>;
}

// Loading repositories
export const WbPageLoadingRepository = createAbstraction<ILoadingRepository>(
    "WebsiteBuilder/PageLoadingRepository"
);
export namespace WbPageLoadingRepository {
    export type Interface = ILoadingRepository;
}

export const WbPageRevisionsLoadingRepository = createAbstraction<ILoadingRepository>(
    "WebsiteBuilder/PageRevisionsLoadingRepository"
);
export namespace WbPageRevisionsLoadingRepository {
    export type Interface = ILoadingRepository;
}

// Meta repository
export const WbPageMetaRepository = createAbstraction<IMetaRepository>(
    "WebsiteBuilder/PageMetaRepository"
);
export namespace WbPageMetaRepository {
    export type Interface = IMetaRepository;
}

// Params repository
export const WbPageParamsRepository = createAbstraction<IParamsRepository>(
    "WebsiteBuilder/PageParamsRepository"
);
export namespace WbPageParamsRepository {
    export type Interface = IParamsRepository;
}

// Search repository
export const WbPageSearchRepository = createAbstraction<ISearchRepository>(
    "WebsiteBuilder/PageSearchRepository"
);
export namespace WbPageSearchRepository {
    export type Interface = ISearchRepository;
}

// Sorting repository
export const WbPageSortingRepository = createAbstraction<ISortingRepository>(
    "WebsiteBuilder/PageSortingRepository"
);
export namespace WbPageSortingRepository {
    export type Interface = ISortingRepository;
}

// Filter repository
export const WbPageFilterRepository = createAbstraction<IFilterRepository>(
    "WebsiteBuilder/PageFilterRepository"
);
export namespace WbPageFilterRepository {
    export type Interface = IFilterRepository;
}

// Selected items repository
export const WbPageSelectedItemsRepository = createAbstraction<ISelectedItemsRepository>(
    "WebsiteBuilder/PageSelectedItemsRepository"
);
export namespace WbPageSelectedItemsRepository {
    export type Interface = ISelectedItemsRepository;
}
