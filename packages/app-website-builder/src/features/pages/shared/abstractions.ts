import { createAbstraction } from "@webiny/feature/admin";
import type { ILoadingRepository, IMetaRepository } from "@webiny/app-utils";
import type { IListCache } from "@webiny/app-admin/features/listCache/index.js";
import type { IListCache as IRevisionListCache } from "~/domain/PageRevision/ListCache.js";
import type { Page } from "~/domain/Page/Page.js";
import type { PageRevision } from "~/domain/PageRevision/PageRevision.js";

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
