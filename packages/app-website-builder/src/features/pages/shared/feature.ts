import { createFeature } from "@webiny/feature/admin";
import { loadingRepositoryFactory, metaRepositoryFactory } from "@webiny/app-utils";
import { pageListCache, fullPageCache } from "~/domain/Page/index.js";
import { pageRevisionsCacheFactory } from "~/domain/PageRevision/index.js";
import {
    PageListCache,
    FullPageCache,
    PageRevisionsCache,
    WbPageLoadingRepository,
    WbPageRevisionsLoadingRepository,
    WbPageMetaRepository
} from "./abstractions.js";

const WB_PAGE_NAMESPACE = "WbPage";
const WB_PAGE_REVISIONS_NAMESPACE = "WbPageRevisions";

export const SharedPageInfrastructureFeature = createFeature({
    name: "WebsiteBuilder/SharedPageInfrastructure",
    register(container) {
        container.registerInstance(PageListCache, pageListCache);
        container.registerInstance(FullPageCache, fullPageCache);
        container.registerInstance(PageRevisionsCache, pageRevisionsCacheFactory.getCache());

        container.registerInstance(
            WbPageLoadingRepository,
            loadingRepositoryFactory.getRepository(WB_PAGE_NAMESPACE)
        );
        container.registerInstance(
            WbPageRevisionsLoadingRepository,
            loadingRepositoryFactory.getRepository(WB_PAGE_REVISIONS_NAMESPACE)
        );

        container.registerInstance(
            WbPageMetaRepository,
            metaRepositoryFactory.getRepository(WB_PAGE_NAMESPACE)
        );
    },
    resolve() {
        return {};
    }
});
